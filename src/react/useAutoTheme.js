/**
 * AutoTheme React Hook.
 * Provides a reactive wrapper around `auto()` that re-evaluates on time
 * boundaries and triggers React re-renders automatically.
 *
 * @module react/useAutoTheme
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { auto, compile } from '../core/engine.js';

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

  // Deep compare memoize to prevent infinite loops when inline arrays are passed
  const rulesRef = useRef(rules);
  const compiledRef = useRef(null);

  if (JSON.stringify(rules) !== JSON.stringify(rulesRef.current) || !compiledRef.current) {
    rulesRef.current = rules;
    compiledRef.current = compile(rules);
  }
  const memoizedCompiledRules = compiledRef.current;

  const fallbackRef = useRef(fallback);
  if (JSON.stringify(fallback) !== JSON.stringify(fallbackRef.current)) {
    fallbackRef.current = fallback;
  }
  const memoizedFallback = fallbackRef.current;

  const evaluate = useCallback(
    () => auto(memoizedCompiledRules, memoizedFallback),
    [memoizedCompiledRules, memoizedFallback]
  );

  // Use a callback initializer so if `evaluate()` returns a function, React doesn't execute it
  const [style, setStyle] = useState(() => evaluate());

  useEffect(() => {
    // Wrap evaluate() in a callback so if the payload is a function, React stores it directly
    setStyle(() => evaluate());

    const tick = () => setStyle(() => evaluate());
    
    // Sync to the next boundary to prevent timer drift
    let intervalId;
    const msUntilNext = interval - (Date.now() % interval);
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, interval);
    }, msUntilNext);

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, [evaluate, interval]);

  return style;
}
