import { tick } from "../core/utils";

/**
 * AutoTheme CSS Variables Adapter.
 * Dynamically injects/removes CSS custom properties on a target element.
 * Returns a { stop() } controller to tear down the live-update loop.
 *
 * @module adapters/css-vars
 */

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
  const el =
    target ||
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) return { stop() {} };
  const compiled = compile(cssEntryArray);

  evaluateTimeMatches(matchedRules, totalMinutes);

  // Initial evaluation
  tick(compiled);

  // Sync to the next boundary to prevent timer drift
  let intervalId;
  const msUntilNext = interval - (Date.now() % interval);
  const timeoutId = setTimeout(() => {
    tick();
    intervalId = setInterval(tick, interval);
  }, msUntilNext);

  // Re-evaluate when the user returns to the tab
  const onVisibility = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      tick();
    }
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  return {
    stop() {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    },
  };
}
