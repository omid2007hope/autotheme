/**
 * AutoTheme DOM Observer.
 * Continuously applies the active theme to a target DOM element
 * using setInterval and visibilitychange events.
 *
 * @module core/observer
 */

import { auto } from './engine.js';
import { applyClasses } from '../adapters/dom.js';
import { isSsr } from './utils.js';

/**
 * Start observing time changes and automatically apply the matching theme
 * to a DOM element. Returns a controller object to stop the observer.
 *
 * @param {object} config - Observer configuration
 * @param {HTMLElement | string} config.target - Target element or CSS selector
 * @param {Array<import('../types/index.js').AutoRule>} config.rules - Array of rules
 * @param {string} [config.fallback=''] - Default class string when no rule matches
 * @param {number} [config.interval=60000] - Re-evaluation interval in ms (default 60s)
 * @returns {{ stop: () => void }} Controller with a `stop()` method to tear down
 *
 * @example
 * const observer = observe({
 *   target: document.documentElement,
 *   rules: [
 *     { time: 6,  style: 'light-theme' },
 *     { time: 18, style: 'dark-theme' },
 *   ],
 *   fallback: 'light-theme',
 * });
 *
 * // Later, to clean up:
 * observer.stop();
 */
export function observe(config) {
  if (isSsr()) {
    return { stop() {} };
  }

  const {
    target,
    rules,
    fallback = '',
    interval = 60000,
  } = config;

  const el = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!el) {
    console.warn('[autotheme] observe(): target element not found.');
    return { stop() {} };
  }

  let previousStyle = '';

  /**
   * Evaluate rules and apply the result to the target element.
   */
  function tick() {
    const nextStyle = auto(rules, fallback);

    // Only mutate DOM if the style actually changed
    if (nextStyle !== previousStyle) {
      if (typeof nextStyle === 'string') {
        applyClasses(el, previousStyle, nextStyle);
      } else if (typeof nextStyle === 'object' && nextStyle !== null) {
        // Inline style object mode
        // Remove previous inline styles
        if (typeof previousStyle === 'object' && previousStyle !== null) {
          for (const key of Object.keys(previousStyle)) {
            el.style.removeProperty(key);
          }
        }
        for (const [key, value] of Object.entries(nextStyle)) {
          el.style.setProperty(key, value);
        }
      }
      previousStyle = nextStyle;
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
