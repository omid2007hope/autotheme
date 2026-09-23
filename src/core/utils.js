/**
 * Pure date/time parsing helpers for the AutoTheme engine.
 * Zero dependencies — uses only the native Date API.
 *
 * @module core/utils
 */

/**
 * Check if the current environment is server-side (no `window`).
 * @returns {boolean}
 */
export function isSsr() {
  return typeof window === "undefined";
}

/**
 * Parse a date string into its numeric components.
 * Accepts "MM-DD" (recurring) or "YYYY-MM-DD" (one-off).
 *
 * @param {string} str - Date string in "MM-DD" or "YYYY-MM-DD" format
 * @returns {{ month: number, day: number, year?: number }} Parsed components (month is 1-based)
 */
export function parseDate(str) {
  if (str == null) return;
  const safeStr = typeof str === "string" ? str : String(str);
  const parts = safeStr.split("-");

  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    };
  }

  if (parts.length === 2) {
    return {
      month: parseInt(parts[0], 10),
      day: parseInt(parts[1], 10),
    };
  }

  return undefined;
}

/**
 * Check if a given Date matches an exact date rule.
 *
 * @param {{ date: string }} rule - Rule with a `date` field ("MM-DD" or "YYYY-MM-DD")
 * @param {Date} now - The current date to evaluate against
 * @returns {boolean}
 */
export function isExactDateMatch(rule, now) {
  const parsed = parseDate(rule.date);
  if (!parsed) return false;

  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (parsed.year != null) {
    return (
      parsed.year === now.getFullYear() &&
      parsed.month === month &&
      parsed.day === day
    );
  }

  return parsed.month === month && parsed.day === day;
}

/**
 * Check if a given Date falls within a since/until date range.
 * Handles year-wrapping ranges (e.g., Dec 1 → Feb 28 for winter).
 *
 * @param {{ since: string, until: string }} rule - Rule with `since` and `until` fields
 * @param {Date} now - The current date to evaluate against
 * @returns {boolean}
 */
export function isInDateRange(rule, now) {
  const since = parseDate(rule.since);
  const until = parseDate(rule.until);
  if (!since || !until) return false;

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // If both rules have a year, do an absolute range check (YYYYMMDD)
  if (since.year != null && until.year != null) {
    const todayVal = year * 10000 + month * 100 + day;
    const sinceVal = since.year * 10000 + since.month * 100 + since.day;
    const untilVal = until.year * 10000 + until.month * 100 + until.day;

    return todayVal >= sinceVal && todayVal <= untilVal;
  }

  // Otherwise, fallback to annual recurrence (MMDD)
  const todayVal = month * 100 + day;
  const sinceVal = since.month * 100 + since.day;
  const untilVal = until.month * 100 + until.day;

  // Non-wrapping range (e.g., Jun 1 → Aug 31)
  if (sinceVal <= untilVal) {
    return todayVal >= sinceVal && todayVal <= untilVal;
  }

  // Wrapping range (e.g., Dec 1 → Feb 28)
  return todayVal >= sinceVal || todayVal <= untilVal;
}

/**
 * Parse a time value into total minutes from midnight.
 * @param {number|string} timeVal
 * @returns {number|null}
 */
export function parseTime(timeVal) {
  if (typeof timeVal === "number") {
    if (timeVal >= 0 && timeVal <= 23) {
      return timeVal * 60; // legacy hours
    }
  } else if (typeof timeVal === "string") {
    if (timeVal.includes(":")) {
      const parts = timeVal.split(":");
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return h * 60 + m;
      }
    } else {
      const h = parseInt(timeVal, 10);
      if (!isNaN(h) && h >= 0 && h <= 23) {
        return h * 60;
      }
    }
  }
  return null;
}

/**
 * Find the best matching time-of-day rule for the current time.
 * Assumes the `timeRules` array is already sorted descending by the compiler.
 *
 * @param {Array<{ _minutes: number, style: string | object }>} timeRules - Rules with `_minutes` fields
 * @param {number} totalMinutes - Current total minutes from midnight
 * @returns {{ _minutes: number, style: string | object } | null} The matching rule or null
 */
export function getMatchingTimeRule(timeRules, totalMinutes) {
  if (timeRules.length === 0) return null;

  for (const rule of timeRules) {
    if (totalMinutes >= rule._minutes) {
      return rule;
    }
  }

  // If no rule has a time ≤ the current hour, wrap around to the latest rule
  // (e.g., it's 2 AM and the last rule starts at 22:00 — that's still the active one)
  return timeRules[0];
}

export const evaluateTimeMatches = (matchedRules, totalMinutes) => {
  if (matchedRules.length === 0) return null;
  const hasTimeRule = matchedRules.some((r) => r.time != null);
  if (hasTimeRule) {
    const normalizedTimeRules = matchedRules.map((r) =>
      r.time != null ? r : { ...r, _minutes: 0 },
    );
    // Sort locally since utils getMatchingTimeRule no longer sorts
    normalizedTimeRules.sort((a, b) => b._minutes - a._minutes);
    return getMatchingTimeRule(normalizedTimeRules, totalMinutes);
  }
  return matchedRules[0];
};

export function tick(compiled) {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();

  let matched = evaluateTimeMatches(
    compiled.exactOneOff.filter((r) => isExactDateMatch(r, now)),
    totalMinutes,
  );

  if (!matched) {
    matched = evaluateTimeMatches(
      compiled.exactRecurring.filter((r) => isExactDateMatch(r, now)),
      totalMinutes,
    );
  }

  if (!matched) {
    matched = evaluateTimeMatches(
      compiled.dateRanges.filter((r) => isInDateRange(r, now)),
      totalMinutes,
    );
  }

  if (!matched) {
    matched = getMatchingTimeRule(compiled.timeRules, totalMinutes);
  }

  if (!matched || !matched.vars) return;

  // Remove ALL custom properties that any rule could have set
  for (const key of compiled.allVarKeys) {
    el.style.removeProperty(key);
  }

  // Set the matched vars
  for (const [key, value] of Object.entries(matched.vars)) {
    el.style.setProperty(key, value);
  }
}
