/**
 * AutoTheme React Hook.
 * Provides a reactive wrapper around `auto()` that re-evaluates on time
 * boundaries and triggers React re-renders automatically.
 *
 * @module react/useAutoTheme
 */

import { useState, useEffect, useCallback } from 'react';
import { auto } from '../core/engine.js';

/**
 * React hook that returns the currently active style and re-evaluates
 * on a configurable interval + tab visibility changes.
 *
 * @param {Array<import('../types/index.js').AutoRule>} rules - Array of rules
 * @param {string | object} [fallback=''] - Default style when no rule matches
 * @param {{ interval?: number }} [options={}] - Options (interval in ms, default 60000)
 * @returns {string | object} The currently active style
 *
 * @example
 * import { useAutoTheme } from 'autotheme/react';
 *
 * const rules = [
 *   { time: 6,  style: 'bg-white text-black' },
 *   { time: 18, style: 'bg-zinc-900 text-white' },
 * ];
 *
 * export default function App() {
 *   const currentStyle = useAutoTheme(rules, 'bg-gray-100');
 *   return <div className={currentStyle}>Hello</div>;
 * }
 */
export function useAutoTheme(rules, fallback = '', options = {}) {
  const { interval = 60000 } = options;

  const evaluate = useCallback(() => auto(rules, fallback), [rules, fallback]);

  const [style, setStyle] = useState(evaluate);

  useEffect(() => {
    // Re-evaluate immediately in case rules/fallback changed
    setStyle(evaluate());

    const tick = () => setStyle(evaluate());
    const id = setInterval(tick, interval);

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      clearInterval(id);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [evaluate, interval]);

  return style;
}
