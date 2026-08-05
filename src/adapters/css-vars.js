/**
 * AutoTheme CSS Variables Adapter.
 * Dynamically injects/removes CSS custom properties on a target element.
 *
 * @module adapters/css-vars
 */

import { isSsr, isInDateRange, isExactDateMatch, getMatchingTimeRule } from '../core/utils.js';

/**
 * @typedef {object} AutoVarRule
 * @property {number} [time] - Hour of day (0–23)
 * @property {string} [date] - Exact date ("MM-DD" or "YYYY-MM-DD")
 * @property {string} [since] - Start of date range
 * @property {string} [until] - End of date range
 * @property {Record<string, string>} vars - CSS custom properties to set
 */

/**
 * Evaluate rules and inject the matching CSS custom properties into a
 * target element. Removes properties from the previous match before
 * applying the new set.
 *
 * @param {AutoVarRule[]} rules - Array of variable rules
 * @param {HTMLElement} [target] - Target element (defaults to `document.documentElement`)
 *
 * @example
 * autoVars([
 *   { time: 6,  vars: { '--bg': '#fffbeb', '--text': '#78350f' } },
 *   { time: 18, vars: { '--bg': '#0f172a', '--text': '#e2e8f0' } },
 * ]);
 */
export function autoVars(rules, target) {
  if (isSsr()) return;

  const el = target || document.documentElement;
  const now = new Date();
  const hour = now.getHours();
  const exactOneOff = [];
  const exactRecurring = [];
  const dateRanges = [];
  const timeRules = [];

  for (const rule of rules) {
    if (rule.date != null) {
      const parts = rule.date.split("-");
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

  const evaluateTimeMatches = (matchedRules) => {
    if (matchedRules.length === 0) return null;
    const hasTimeRule = matchedRules.some((r) => r.time != null);
    if (hasTimeRule) {
      const normalizedTimeRules = matchedRules.map((r) =>
        r.time != null ? r : { ...r, time: 0 }
      );
      return getMatchingTimeRule(normalizedTimeRules, hour);
    }
    return matchedRules[0];
  };

  let matched = evaluateTimeMatches(exactOneOff.filter(r => isExactDateMatch(r, now)));

  if (!matched) {
    matched = evaluateTimeMatches(exactRecurring.filter(r => isExactDateMatch(r, now)));
  }

  if (!matched) {
    matched = evaluateTimeMatches(dateRanges.filter(r => isInDateRange(r, now)));
  }

  if (!matched) {
    matched = getMatchingTimeRule(timeRules, hour);
  }

  if (!matched || !matched.vars) return;

  // Remove ALL custom properties that any rule could have set
  const allKeys = new Set();
  for (const rule of rules) {
    if (rule.vars) {
      for (const key of Object.keys(rule.vars)) {
        allKeys.add(key);
      }
    }
  }
  for (const key of allKeys) {
    el.style.removeProperty(key);
  }

  // Set the matched vars
  for (const [key, value] of Object.entries(matched.vars)) {
    el.style.setProperty(key, value);
  }
}
