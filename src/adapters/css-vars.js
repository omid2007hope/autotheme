/**
 * AutoTheme CSS Variables Adapter.
 * Dynamically injects/removes CSS custom properties on a target element.
 * Returns a { stop() } controller to tear down the live-update loop.
 *
 * @module adapters/css-vars
 */

import {
  isSsr,
  isInDateRange,
  isExactDateMatch,
  getMatchingTimeRule,
} from "../core/utils.js";
import { compile } from "../core/engine.js";

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
 * target element. Automatically re-evaluates on a configurable interval
 * and when the tab regains visibility. Returns a controller to stop updates.
 *
 * @param {AutoVarRule[]} cssEntryArray - Array of variable rules or a compiled rule object
 * @param {HTMLElement} [target] - Target element (defaults to `document.documentElement`)
 * @param {number} [interval=60000] - Re-evaluation interval in ms (default 60s)
 * @returns {{ stop: () => void }} Controller with a `stop()` method to tear down
 *
 * @example
 * const controller = autoVars([
 *   { time: 6,  vars: { '--bg': '#fffbeb', '--text': '#78350f' } },
 *   { time: 18, vars: { '--bg': '#0f172a', '--text': '#e2e8f0' } },
 * ]);
 *
 * // Later, to stop live updates:
 * controller.stop();
 */
export function autoVars(cssEntryArray, target, interval = 60000) {
  if (isSsr()) return { stop() {} };

  const el = target || document.documentElement;
  const compiled = compile(cssEntryArray);

  const evaluateTimeMatches = (matchedRules, totalMinutes) => {
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

  function tick() {
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

  // Initial evaluation
  tick();

  // Sync to the next boundary to prevent timer drift
  let intervalId;
  const msUntilNext = interval - (Date.now() % interval);
  const timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, interval);
  }, msUntilNext);

  // Re-evaluate when the user returns to the tab
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    stop() {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
