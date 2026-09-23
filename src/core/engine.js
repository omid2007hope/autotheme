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
 * @param {Array<import('../types/index.js').AutoRule>} cssEntryArray - Array of css objects
 * @param {string | object} [fallback=''] - Default style when no css matches
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
export function compile(cssStyle) {
  if (!Array.isArray(cssStyle)) {
    // If it's already an object with our bucket arrays, it's pre-compiled!
    if (cssStyle && cssStyle.timeRules && cssStyle.exactOneOff) return cssStyle;
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

  for (const css of cssStyle) {
    // safety guard
    if (!css || typeof css !== "object") {
      continue;
    }

    // Extract var keys for css-vars.js optimization
    if (css.vars) {
      for (const key of Object.keys(css.vars)) {
        allVarKeys.add(key);
      }
    }

    const parsedMinutes = css.time != null ? parseTime(css.time) : null;
    const compiledRule =
      parsedMinutes !== null ? { ...css, _minutes: parsedMinutes } : css;

    // If date and time together
    if (css.date != null && css.time != null) {
      const dateStr = String(css.date);
      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;

      if (!isValidDate) {
        console.warn(
          "[autotheme] compile(): rule ignored — invalid date string (length must be 4–10 chars)",
          css,
        );
        continue;
      }
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          css,
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
    else if (css.date != null) {
      const dateStr = String(css.date);
      const isValidDate = dateStr.length >= 4 && dateStr.length <= 10;

      if (!isValidDate) {
        console.warn(
          "[autotheme] compile(): rule ignored — invalid date string (length must be 4–10 chars)",
          css,
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
    else if (css.since != null && css.until != null && css.time != null) {
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          css,
        );
        continue;
      }
      dateRanges.push(compiledRule);
    }
    // If only time
    else if (css.time != null) {
      if (parsedMinutes === null) {
        console.warn(
          '[autotheme] compile(): rule ignored — invalid time value (must be 0–23 or "HH:MM")',
          css,
        );
        continue;
      }
      timeRules.push(compiledRule);
    }
    // If only range (since + until, no time)
    else if (css.since != null && css.until != null) {
      dateRanges.push(compiledRule);
    }
    // since without until, or until without since — invalid
    else if (css.since != null || css.until != null) {
      console.warn(
        '[autotheme] compile(): rule ignored — "since" and "until" must both be present',
        css,
      );
    }
    // No recognisable keys — warn and skip
    else {
      console.warn(
        "[autotheme] compile(): rule ignored — no valid keys (date, time, since/until) found",
        css,
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

export function auto(cssEntryArray, fallback = "", _now) {
  if (
    !cssEntryArray ||
    (Array.isArray(cssEntryArray) && cssEntryArray.length === 0)
  ) {
    return fallback;
  }

  const compiled = compile(cssEntryArray);
  const now = _now || new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper to evaluate time conditions for rules that matched a date condition.
  // Returns the matched rule object, or null if nothing matched.
  // This lets callers distinguish "no match" (null) from "matched with falsy style".
  const evaluateTimeMatches = (matchedRules) => {
    // Check if exist or is an array
    if (!Array.isArray(matchedRules) || matchedRules.length === 0) return null;

    // If any css has a time condition, we must evaluate them together
    const hasTimeRule = matchedRules.some((r) => r.time != null);
    if (hasTimeRule) {
      // Treat rules without a time condition as active from midnight (time: 0)
      const normalizedTimeRules = matchedRules.map((r) =>
        r.time != null ? r : { ...r, _minutes: 0 },
      );
      // Sort locally since utils getMatchingTimeRule no longer sorts
      normalizedTimeRules.sort((a, b) => b._minutes - a._minutes);
      
      // T05: If time is before the earliest specified rule for this date and no midnight rule exists,
      // return null so lower-priority time rules or fallback can apply instead of wrapping around.
      const earliestRule = normalizedTimeRules[normalizedTimeRules.length - 1];
      if (earliestRule._minutes > 0 && totalMinutes < earliestRule._minutes) {
        return null;
      }

      return getMatchingTimeRule(normalizedTimeRules, totalMinutes); // rule | null
    }

    return matchedRules[0]; // rule object
  };

  // Priority 1: One-off exact date (YYYY-MM-DD)
  const matchedOneOffs = compiled.exactOneOff.filter((r) =>
    isExactDateMatch(r, now),
  );
  const oneOffRule = evaluateTimeMatches(matchedOneOffs);
  if (oneOffRule != null) return oneOffRule.style;

  // Priority 2: Recurring exact date (MM-DD)
  const matchedRecurring = compiled.exactRecurring.filter((r) =>
    isExactDateMatch(r, now),
  );
  const recurringRule = evaluateTimeMatches(matchedRecurring);
  if (recurringRule != null) return recurringRule.style;

  // Priority 3: Date ranges (since/until)
  const matchedRanges = compiled.dateRanges.filter((r) =>
    isInDateRange(r, now),
  );
  const rangeRule = evaluateTimeMatches(matchedRanges);
  if (rangeRule != null) return rangeRule.style;

  // Priority 4: Time-of-day
  const matchedTime = getMatchingTimeRule(compiled.timeRules, totalMinutes);
  if (matchedTime != null) {
    return matchedTime.style;
  }

  // Priority 5: Fallback
  return fallback;
}
