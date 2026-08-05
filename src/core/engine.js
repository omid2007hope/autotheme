/**
 * AutoTheme Core Engine.
 * The brain of the package — evaluates rules against the current time/date
 * and returns the matching style payload.
 *
 * @module core/engine
 */

import {
  isExactDateMatch,
  isInDateRange,
  getMatchingTimeRule,
  isSsr,
} from "./utils.js";

/**
 * Evaluate an array of rules against the current local time and return
 * the matching style.
 *
 * Priority order (highest → lowest):
 *   1. Exact date match (YYYY-MM-DD)
 *   2. Recurring date match (MM-DD)
 *   3. Date range match (since/until)
 *   4. Time-of-day match
 *   5. Fallback
 *
 * @param {Array<import('../types/index.js').AutoRule>} rules - Array of rule objects
 * @param {string | object} [fallback=''] - Default style when no rule matches
 * @param {Date} [_now] - Internal: override current date for testing
 * @returns {string | object} The matching style value
 *
 * @example
 * // Tailwind usage
 * auto([
 *   { time: 6,  style: 'bg-white text-black' },
 *   { time: 18, style: 'bg-zinc-900 text-white' },
 * ], 'bg-gray-100');
 *
 * @example
 * // Inline style usage
 * auto([
 *   { time: 6,  style: { backgroundColor: '#fff' } },
 *   { time: 18, style: { backgroundColor: '#111' } },
 * ], { backgroundColor: '#eee' });
 *
 * @example
 * // Date override
 * auto([
 *   { date: '10-31', style: 'bg-orange-600' },
 *   { time: 18, style: 'bg-zinc-900' },
 * ]);
 */
/**
 * Pre-compile rules to eliminate sorting and GC overhead during evaluation.
 * @param {Array<import('../types/index.js').AutoRule>} rules
 * @returns {object} Compiled rules structure
 */
export function compile(rules) {
  if (!Array.isArray(rules)) {
    if (rules && rules.__compiled) return rules;
    return {
      __compiled: true,
      exactOneOff: [],
      exactRecurring: [],
      dateRanges: [],
      timeRules: [],
      allVarKeys: [],
    };
  }

  const exactOneOff = [];
  const exactRecurring = [];
  const dateRanges = [];
  const timeRules = [];
  const allVarKeys = new Set();

  for (const rule of rules) {
    // Extract var keys for css-vars.js optimization
    if (rule.vars) {
      for (const key of Object.keys(rule.vars)) {
        allVarKeys.add(key);
      }
    }

    // If date and time together
    if (rule.date != null && rule.time != null) {
      const dateStr = String(rule.date);
      const timeStr = String(rule.time);

      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;
      const isValidTime = timeStr.length <= 2 || timeStr.length >= 8;

      if (isValidDate && isValidTime) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          exactOneOff.push(rule);
        } else {
          exactRecurring.push(rule);
        }
      }
    }
    // If only date
    else if (rule.date != null) {
      const dateStr = String(rule.date);
      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;

      if (isValidDate) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          exactOneOff.push(rule);
        } else {
          exactRecurring.push(rule);
        }
      }
    }
    // If only time
    else if (rule.time != null) {
      const timeStr = String(rule.time);
      const isValidTime = timeStr.length <= 2 || timeStr.length >= 8;

      if (isValidTime) {
        timeRules.push(rule);
      }
    }
    // If only range
    else if (rule.since != null && rule.until != null) {
      dateRanges.push(rule);
    }
  }

  // Pre-sort time rules descending
  timeRules.sort((a, b) => b.time - a.time);

  return {
    __compiled: true,
    exactOneOff,
    exactRecurring,
    dateRanges,
    timeRules,
    allVarKeys: Array.from(allVarKeys),
  };
}

export function auto(rulesInput, fallback = "", _now) {
  if (!rulesInput || (Array.isArray(rulesInput) && rulesInput.length === 0)) {
    return fallback;
  }

  const compiled = compile(rulesInput);
  const now = _now || new Date();
  const hour = now.getHours();

  // Helper to evaluate time conditions for rules that matched a date condition
  const evaluateTimeMatches = (matchedRules) => {
    if (matchedRules.length === 0) return null;

    // If any rule has a time condition, we must evaluate them together
    const hasTimeRule = matchedRules.some((r) => r.time != null);
    if (hasTimeRule) {
      // Treat rules without a time condition as active from midnight (time: 0)
      const normalizedTimeRules = matchedRules.map((r) =>
        r.time != null ? r : { ...r, time: 0 }
      );
      // Sort locally since utils getMatchingTimeRule no longer sorts
      normalizedTimeRules.sort((a, b) => b.time - a.time);
      const bestMatch = getMatchingTimeRule(normalizedTimeRules, hour);
      return bestMatch ? bestMatch.style : null;
    }

    return matchedRules[0].style;
  };

  // Priority 1: One-off exact date (YYYY-MM-DD)
  const matchedOneOffs = compiled.exactOneOff.filter((r) => isExactDateMatch(r, now));
  const oneOffStyle = evaluateTimeMatches(matchedOneOffs);
  if (oneOffStyle) return oneOffStyle;

  // Priority 2: Recurring exact date (MM-DD)
  const matchedRecurring = compiled.exactRecurring.filter((r) => isExactDateMatch(r, now));
  const recurringStyle = evaluateTimeMatches(matchedRecurring);
  if (recurringStyle) return recurringStyle;

  // Priority 3: Date ranges (since/until)
  const matchedRanges = compiled.dateRanges.filter((r) => isInDateRange(r, now));
  const rangeStyle = evaluateTimeMatches(matchedRanges);
  if (rangeStyle) return rangeStyle;

  // Priority 4: Time-of-day
  const matchedTime = getMatchingTimeRule(compiled.timeRules, hour);
  if (matchedTime) {
    return matchedTime.style;
  }

  // Priority 5: Fallback
  return fallback;
}
