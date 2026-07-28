/**
 * AutoTheme Core Engine.
 * The brain of the package — evaluates rules against the current time/date
 * and returns the matching style payload.
 *
 * @module core/engine
 */

import { isExactDateMatch, isInDateRange, getMatchingTimeRule, isSsr } from './utils.js';

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
export function auto(rules, fallback = '', _now) {
  if (!rules || rules.length === 0) {
    return fallback;
  }

  const now = _now || new Date();

  // ── Phase 1: Exact date matches (highest priority) ──
  // Check YYYY-MM-DD (one-off) first, then MM-DD (recurring)
  const exactOneOff = [];
  const exactRecurring = [];
  const dateRanges = [];
  const timeRules = [];

  for (const rule of rules) {
    if (rule.date != null) {
      const parts = rule.date.split('-');
      if (parts.length === 3) {
        exactOneOff.push(rule);
      } else {
        exactRecurring.push(rule);
      }
    } else if (rule.since != null && rule.until != null) {
      dateRanges.push(rule);
    } else if (rule.time != null) {
      timeRules.push(rule);
    }
  }

  // Priority 1: One-off exact date (YYYY-MM-DD)
  for (const rule of exactOneOff) {
    if (isExactDateMatch(rule, now)) {
      return rule.style;
    }
  }

  // Priority 2: Recurring exact date (MM-DD)
  for (const rule of exactRecurring) {
    if (isExactDateMatch(rule, now)) {
      return rule.style;
    }
  }

  // Priority 3: Date ranges (since/until)
  for (const rule of dateRanges) {
    if (isInDateRange(rule, now)) {
      return rule.style;
    }
  }

  // Priority 4: Time-of-day
  const hour = now.getHours();
  const matched = getMatchingTimeRule(timeRules, hour);
  if (matched) {
    return matched.style;
  }

  // Priority 5: Fallback
  return fallback;
}
