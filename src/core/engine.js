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
  parseTime,
  resolveRule,
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
 * @param {Array<import('../types/index.js').AutoRule>} cssEntryArray - Array of eachRule objects
 * @param {string | object} [fallback=''] - Default style when no eachRule matches
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
    // If it's already an object with our bucket arrays, it's pre-compiled!
    if (rules && rules.timeRules && rules.exactOneOff) return rules;
    return {
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

  for (const eachRule of rules) {
    // safety guard
    if (!eachRule || typeof eachRule !== "object") {
      continue;
    }

    // Extract var keys for eachRule-vars.js optimization
    if (eachRule.vars) {
      for (const key of Object.keys(eachRule.vars)) {
        allVarKeys.add(key);
      }
    }

    const parsedMinutes =
      eachRule.time != null ? parseTime(eachRule.time) : null;
    const compiledRule =
      parsedMinutes !== null
        ? { ...eachRule, _minutes: parsedMinutes }
        : eachRule;

    // If date and time together
    if (eachRule.date != null && eachRule.time != null) {
      const dateStr = String(eachRule.date);
      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;

      if (!isValidDate) {
        console.warn(
          "[autotheme] compile(): rule ignored — invalid date string (length must be 4–10 chars)",
          eachRule,
        );
        continue;
      }
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          eachRule,
        );
        continue;
      }

      const parts = dateStr.split("-");
      if (parts.length === 3) {
        exactOneOff.push(compiledRule);
      } else {
        exactRecurring.push(compiledRule);
      }
    }
    // If only date
    else if (eachRule.date != null) {
      const dateStr = String(eachRule.date);
      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;

      if (!isValidDate) {
        console.warn(
          "[autotheme] compile(): rule ignored — invalid date string (length must be 4–10 chars)",
          eachRule,
        );
        continue;
      }

      const parts = dateStr.split("-");
      if (parts.length === 3) {
        exactOneOff.push(compiledRule);
      } else {
        exactRecurring.push(compiledRule);
      }
    }
    // If date range + time together (composite rule) — must check BEFORE lone time branch
    else if (
      eachRule.since != null &&
      eachRule.until != null &&
      eachRule.time != null
    ) {
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          eachRule,
        );
        continue;
      }
      dateRanges.push(compiledRule);
    }
    // If only time
    else if (eachRule.time != null) {
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          eachRule,
        );
        continue;
      }
      timeRules.push(compiledRule);
    }
    // If only range (since + until, no time)
    else if (eachRule.since != null && eachRule.until != null) {
      dateRanges.push(compiledRule);
    }
    // since without until, or until without since — invalid
    else if (eachRule.since != null || eachRule.until != null) {
      console.warn(
        '[autotheme] compile(): rule ignored — "since" and "until" must both be present',
        eachRule,
      );
    }
    // No recognisable keys — warn and skip
    else {
      console.warn(
        "[autotheme] compile(): rule ignored — no valid keys (date, time, since/until) found",
        eachRule,
      );
    }
  }

  // Pre-sort time rules descending
  timeRules.sort((a, b) => b._minutes - a._minutes);

  return {
    exactOneOff,
    exactRecurring,
    dateRanges,
    timeRules,
    allVarKeys: Array.from(allVarKeys),
  };
}

export function auto(rules, fallback = "", _now) {
  if (
    !rules ||
    !Array.isArray(rules) ||
    (Array.isArray(rules) && rules.length === 0)
  ) {
    return fallback;
  }

  const compiled = compile(rules);
  const now = _now || new Date();

  const matchedRule = resolveRule(compiled, now);

  if (matchedRule != null && matchedRule && matchedRule.style !== undefined)
    return matchedRule.style;

  // Priority 5: Fallback
  return fallback;
}
