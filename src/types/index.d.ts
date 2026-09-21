import { compile } from "../core/engine";

// ──────────────────────────────────────────────────────────────
// AutoTheme — TypeScript Declarations
// ──────────────────────────────────────────────────────────────

/**
 * A single theming rule evaluated by the AutoTheme engine.
 *
 * Priority order when multiple rules match:
 *   1. Exact date (YYYY-MM-DD)
 *   2. Recurring date (MM-DD)
 *   3. Date range (since/until)
 *   4. Time of day
 */
export interface AutoRule<T = string | Record<string, string>> {
  /**
   * Hour of day (0–23). The rule activates from this hour onward
   * until a later time-based rule takes over.
   * @example { time: 18 } // activates at 6 PM
   */
  time?: number | string;

  /**
   * Exact date match.
   * - `"MM-DD"` for recurring annual dates (e.g., `"10-31"` for Halloween)
   * - `"YYYY-MM-DD"` for one-off dates (e.g., `"2027-11-26"` for Black Friday 2027)
   */
  date?: string;

  /**
   * Start of a date range (inclusive).
   * Use with `until` to create seasonal or multi-day rules.
   * Format: `"MM-DD"` or `"YYYY-MM-DD"`.
   * @example { since: '12-01', until: '02-28' } // winter
   */
  since?: string;

  /**
   * End of a date range (inclusive).
   * Use with `since` to create seasonal or multi-day rules.
   * Format: `"MM-DD"` or `"YYYY-MM-DD"`.
   */
  until?: string;

  /**
   * The style payload to return when this rule matches.
   * - Pass a **string** for class-based frameworks (Tailwind, Bootstrap)
   * - Pass an **object** for inline styles
   */
  style: T;
}

/**
 * Interval for `AutoVar` hook
 */
export interface AutoVarInterval {
  interval?: number;
}

/**
 * Controller returned by AutoVar().
 */
export interface AutoVarController {
  /** Stop `AutoVar` and clean up all listeners. */
  stop(): void;
}

/**
 * A rule for CSS custom property injection via `autoVars()`.
 */
export interface AutoVarRule {
  /** Hour of day (0–23). */
  time?: number | string;
  /** Exact date ("MM-DD" or "YYYY-MM-DD"). */
  date?: string;
  /** Start of date range. */
  since?: string;
  /** End of date range. */
  until?: string;
  /** CSS custom properties to set on the target element. */
  vars: Record<string, string>;
}

/**
 * Configuration object for the `observe()` function.
 */
export interface ObserveConfig<T = string | Record<string, string>> {
  /** Target DOM element or CSS selector string. */
  target: HTMLElement | string;
  /** Array of theming rules. */
  rules: AutoRule<T>[];
  /** Default class string when no rule matches. */
  fallback?: T;
  /** Re-evaluation interval in milliseconds (default: 60000). */
  interval?: number;
}

/**
 * Controller returned by `observe()`.
 */
export interface ObserveController {
  /** Stop the observer and clean up all listeners. */
  stop(): void;
}

/**
 * Options for the `useAutoTheme` React hook.
 */
export interface UseAutoThemeOptions {
  /** Re-evaluation interval in milliseconds (default: 60000). */
  interval?: number;
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Compiled rules structure optimized for the engine.
 */
export interface CompiledRules<T = string | Record<string, string>> {
  __compiled: boolean;
  exactOneOff: AutoRule<T>[];
  exactRecurring: AutoRule<T>[];
  dateRanges: AutoRule<T>[];
  timeRules: AutoRule<T>[];
  allVarKeys: string[];
}

/**
 * Pre-compile rules to eliminate sorting and GC overhead during evaluation.
 *
 * @param rules - Array of rules to compile
 * @returns Compiled rules structure
 */
export declare function compile<T = string | Record<string, string>>(
  rules: AutoRule<T>[],
): CompiledRules<T>;

/**
 * Evaluate an array of rules against the current local time and return
 * the matching style.
 *
 * @param cssEntryArray - Array of rule objects
 * @param fallback - Default style when no rule matches
 * @returns The matching style value (string or object)
 */
export declare function auto<T = string | Record<string, string>>(
  cssEntryArray: AutoRule<T>[],
  fallback?: T,
): T;

/**
 * Inject CSS custom properties into a target element based on
 * the current time/date.
 *
 * @param cssEntryArray - Array of variable rules
 * @param target - Target element (defaults to document.documentElement)
 */
export declare function autoVars(
  cssEntryArray: AutoVarRule[],
  target?: HTMLElement,
  interval?: AutoVarInterval,
): AutoVarController;

/**
 * Start observing time changes and continuously apply the matching
 * theme to a DOM element.
 *
 * @param config - Observer configuration
 * @returns Controller with a `stop()` method
 */
export declare function observe<T = string | Record<string, string>>(
  config: ObserveConfig<T>,
): ObserveController;

/**
 * React hook that returns the currently active style and re-evaluates
 * on time boundaries.
 *
 * @param rules - Array of rules
 * @param fallback - Default style when no rule matches
 * @param options - Hook options (interval)
 * @returns The currently active style
 */
export declare function useAutoTheme<T = string | Record<string, string>>(
  rules: AutoRule<T>[],
  fallback?: T,
  options?: UseAutoThemeOptions,
): T;
