/**
 * AutoTheme CSS Variables Adapter.
 * Dynamically injects/removes CSS custom properties on a target element.
 *
 * @module adapters/css-vars
 */

import { isSsr, isInDateRange } from '../core/utils.js';

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
  const month = now.getMonth() + 1;
  const day = now.getDate();

  let matched = null;

  // Priority 1: Exact date matches
  for (const rule of rules) {
    if (rule.date != null) {
      const parts = rule.date.split('-');
      const rMonth = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
      const rDay = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
      if (rMonth === month && rDay === day) {
        matched = rule;
        break;
      }
    }
  }

  // Priority 2: Date range matches
  if (!matched) {
    for (const rule of rules) {
      if (rule.since != null && rule.until != null) {
        if (isInDateRange(rule, now)) {
          matched = rule;
          break;
        }
      }
    }
  }

  // Priority 3: Time-of-day
  if (!matched) {
    const timeRules = rules.filter(r => r.time != null);
    const sorted = [...timeRules].sort((a, b) => b.time - a.time);
    for (const rule of sorted) {
      if (hour >= rule.time) {
        matched = rule;
        break;
      }
    }
    if (!matched && sorted.length > 0) {
      matched = sorted[0];
    }
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
