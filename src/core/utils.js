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
  return typeof window === 'undefined';
}

/**
 * Parse a date string into its numeric components.
 * Accepts "MM-DD" (recurring) or "YYYY-MM-DD" (one-off).
 *
 * @param {string} str - Date string in "MM-DD" or "YYYY-MM-DD" format
 * @returns {{ month: number, day: number, year?: number }} Parsed components (month is 1-based)
 */
export function parseDate(str) {
  const parts = str.split('-');

  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
    };
  }

  return {
    month: parseInt(parts[0], 10),
    day: parseInt(parts[1], 10),
  };
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
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (parsed.year != null) {
    return parsed.year === now.getFullYear() && parsed.month === month && parsed.day === day;
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
  const month = now.getMonth() + 1;
  const day = now.getDate();

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
 * Find the best matching time-of-day rule for the current hour.
 * Rules are sorted descending so the highest hour ≤ current hour wins.
 *
 * @param {Array<{ time: number, style: string | object }>} timeRules - Rules with `time` fields
 * @param {number} hour - Current hour (0–23)
 * @returns {{ time: number, style: string | object } | null} The matching rule or null
 */
export function getMatchingTimeRule(timeRules, hour) {
  if (timeRules.length === 0) return null;

  // Sort descending by time
  const sorted = [...timeRules].sort((a, b) => b.time - a.time);

  for (const rule of sorted) {
    if (hour >= rule.time) {
      return rule;
    }
  }

  // If no rule has a time ≤ the current hour, wrap around to the latest rule
  // (e.g., it's 2 AM and the last rule starts at 22:00 — that's still the active one)
  return sorted[0];
}
