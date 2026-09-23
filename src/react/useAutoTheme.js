"use client";

/**
 * AutoTheme React Hook.
 * Provides a reactive wrapper around `auto()` that re-evaluates on time
 * boundaries and triggers React re-renders automatically.
 *
 * @module react/useAutoTheme
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { auto, compile } from "../core/engine.js";

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
 * import { useAutoTheme } from '@omid2007hope/autotheme/react';
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

// rules e.g {{time: 6.00, style: ""}, {time: 6.00, style: ""}, etc}
function isEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!isEqual(a[key], b[key])) return false;
  }
  return true;
}

export function useAutoTheme(rules, fallback = "", options = {}) {
  // 1. The Safety Guard (Format Check):
  // If it's an object with our buckets instead of a raw array, it's precompiled.
  const isPrecompiled = rules && !Array.isArray(rules) && rules.timeRules;

  const { interval = 60000 } = options;

  // Deep compare memoize to prevent infinite loops when inline arrays are passed

  // Dose not react to render, there holds Initial memory address e.g. A
  const rulesRef = useRef(rules);
  const compiledRef = useRef(null);

  // after each render new memory address e.g. B
  // Check if initial memory address dose not match current address
  // e.g. A !== B
  const hasChanged = isPrecompiled
    ? rules !== rulesRef.current
    : !isEqual(rules, rulesRef.current);

  if (hasChanged || !compiledRef.current) {
    // initial memory address is you new/current memory address
    // replace A with B replace B with C and so on
    rulesRef.current = rules;
    // and then compile the correct address and hold it in a new ref
    compiledRef.current = isPrecompiled ? rules : compile(rules);
  }
  const memoizedCompiledRules = compiledRef.current;

  const fallbackRef = useRef(fallback);
  if (!isEqual(fallback, fallbackRef.current)) {
    fallbackRef.current = fallback;
  }
  const memoizedFallback = fallbackRef.current;

  const evaluate = useCallback(
    () => auto(memoizedCompiledRules, memoizedFallback),
    [memoizedCompiledRules, memoizedFallback],
  );

  // Initialize with fallback to prevent React hydration mismatches during SSR.
  // The actual theme will be evaluated and synced immediately upon client mount.
  const [style, setStyle] = useState(memoizedFallback);

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

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [evaluate, interval]);

  return style;
}
