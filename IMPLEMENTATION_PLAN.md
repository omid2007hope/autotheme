# AutoTheme — Full Implementation Plan

> **Self-driving CSS. Zero dependencies. Infinite possibilities.**

This document is the complete technical blueprint for building AutoTheme from an empty repo to a published NPM package. Every file, every function, every decision is documented here.

---

## Table of Contents

1. [What Is AutoTheme?](#1-what-is-autotheme)
2. [Architecture Decisions](#2-architecture-decisions)
3. [The Public API](#3-the-public-api)
4. [Project Structure](#4-project-structure)
5. [File-by-File Breakdown](#5-file-by-file-breakdown)
6. [Build Pipeline](#6-build-pipeline)
7. [Testing Strategy](#7-testing-strategy)
8. [Development Schedule](#8-development-schedule)
9. [NPM Publishing Checklist](#9-npm-publishing-checklist)

---

## 1. What Is AutoTheme?

AutoTheme is a **zero-dependency** NPM package that lets front-end developers change CSS styles **automatically based on time, date, or season**.

### The Problem It Solves

Every developer who wants time-based UI changes (dark mode at night, seasonal themes, event-specific styles) currently has to:

1. Write raw `new Date()` logic in every component
2. Manage state (`useState`, `useEffect`) for something that should be declarative
3. Re-invent the same boundary-checking math every single project
4. Often pull in heavy date libraries (Moment.js, Day.js) just for simple comparisons

### The Solution

One function: `auto()`. Pass an array of rules. Get back the matching style. Done.

```js
import { auto } from "autotheme-js";

<div className={auto([
  { time: 6,  style: "bg-white" },
  { time: 18, style: "bg-black text-white" },
], "bg-gray-100")} />
```

### What It Supports

| Feature | Details |
|---|---|
| **CSS Frameworks** | Tailwind CSS, Bootstrap, Standard CSS |
| **JS Frameworks** | React, Next.js, Vue, Svelte, Astro, Vanilla JS, HTML5 |
| **Rule Types** | Time-of-day, exact dates, date ranges (seasons), recurring annual dates |
| **Output Modes** | Class strings, inline style objects, CSS custom properties |
| **Live Updates** | Background observer ticks every 60s + visibility change events |
| **SSR Safe** | Returns fallback when `window` is unavailable |
| **Dependencies** | **Zero. None. Nil.** |

---

## 2. Architecture Decisions

### 2.1 — Client-Side Only

**Decision:** 100% client-side. No server component.

**Why:** The browser already knows the user's local time via `new Date()`. If a user in Tokyo visits a server in New York, the server would think it's daytime while the user is browsing at 2 AM. Client-side evaluation guarantees accuracy. It also eliminates server load, API calls, and hydration mismatches.

### 2.2 — Built-in `Date` Object Only (No Chrono/Cron)

**Decision:** Use the native JavaScript `Date` object exclusively. No `cron-parser`, no `node-cron`, no `chrono-node`.

**Why:** AutoTheme doesn't need second-precision scheduling. It needs to answer one question: *"What time/date is it right now?"* — and `new Date()` answers that perfectly. Adding a scheduling library would:

- Break the zero-dependency guarantee
- Add 50–200KB to the bundle for no benefit
- Introduce Node.js-only APIs that break browser usage

### 2.3 — Zero Dependencies

**Decision:** Ship with `0` runtime dependencies. Only dev dependencies for the build step.

**How it works:**
- Time evaluation → `new Date()` (built into every JS runtime)
- DOM manipulation → `document.documentElement.classList` and `.style.setProperty()` (built into every browser)
- Live updates → `setInterval()` and `document.addEventListener('visibilitychange')` (built-in)
- Module bundling → `tsup` (dev dependency only, not shipped to users)
- Testing → Node.js built-in test runner (`node --test`) — zero-dep

### 2.4 — Dual Module Format (ESM + CJS)

**Decision:** Ship both ES Modules (`import`) and CommonJS (`require`).

**Why:** Maximizes compatibility across every bundler (Vite, Webpack, Rollup, esbuild) and runtime (Node.js, Deno, Bun, browsers).

### 2.5 — Rule Priority System

**Decision:** When multiple rules match, use strict specificity ordering:

```
Exact Date (YYYY-MM-DD)
    ↓
Recurring Date (MM-DD)
    ↓
Date Range (since/until)
    ↓
Time of Day (hour)
    ↓
Fallback
```

**Why:** A developer should be able to set general time-of-day rules AND drop in a one-off "Black Friday" override without worrying about rule ordering. The engine resolves conflicts deterministically.

---

## 3. The Public API

### 3.1 — `auto(rules, fallback?)`

The primary export. A **pure function** with no side effects.

```ts
function auto(rules: AutoRule[], fallback?: string | object): string | object;
```

**Parameters:**
- `rules` — Array of rule objects (see below)
- `fallback` — Default style to return when no rule matches

**Returns:** The `style` value from the highest-priority matching rule, or the fallback.

### 3.2 — Rule Object

```ts
interface AutoRule {
  /** Hour of day (0–23). Active from this hour until the next time-based rule. */
  time?: number;

  /** Exact date. "MM-DD" for recurring, "YYYY-MM-DD" for one-off. */
  date?: string;

  /** Start of a date range. "MM-DD" or "YYYY-MM-DD". */
  since?: string;

  /** End of a date range. "MM-DD" or "YYYY-MM-DD". */
  until?: string;

  /** The style payload: CSS class string OR inline style object. */
  style: string | object;
}
```

### 3.3 — `autoVars(rules, target?)`

Injects **CSS custom properties** into a target element.

```ts
function autoVars(
  rules: AutoVarRule[],
  target?: HTMLElement // defaults to document.documentElement
): void;
```

### 3.4 — `observe(config)`

A **DOM observer** that continuously applies classes/styles to a target element.

```ts
function observe(config: {
  target: HTMLElement | string;
  rules: AutoRule[];
  fallback?: string;
  interval?: number; // default 60000 (60s)
}): { stop: () => void };
```

### 3.5 — `useAutoTheme(rules, fallback?, options?)`

React hook for live-updating themes.

```ts
function useAutoTheme(
  rules: AutoRule[],
  fallback?: string | object,
  options?: { interval?: number }
): string | object;
```

---

## 4. Project Structure

```
autotheme/
├── .github/
│   └── workflows/
│       └── publish.yml              # CI/CD: test → build → publish on release
│
├── src/
│   ├── core/
│   │   ├── engine.js                # Rule matching & specificity sorting
│   │   ├── observer.js              # setInterval + visibilitychange watcher
│   │   └── utils.js                 # Date parsing helpers (parseDate, parseTime)
│   │
│   ├── adapters/
│   │   ├── dom.js                   # classList.add/remove for class-based themes
│   │   └── css-vars.js              # style.setProperty for CSS custom properties
│   │
│   ├── react/
│   │   └── useAutoTheme.js          # React custom hook
│   │
│   ├── types/
│   │   └── index.d.ts               # TypeScript type declarations
│   │
│   └── index.js                     # Main entry — exports auto, autoVars, observe
│
├── tests/
│   ├── engine.test.js               # Core rule matching unit tests
│   ├── observer.test.js             # Timer and boundary event tests
│   ├── utils.test.js                # Date parsing edge case tests
│   └── integration.test.js          # End-to-end rule evaluation tests
│
├── examples/
│   ├── html-tailwind/
│   │   └── index.html               # CDN / script-tag vanilla demo
│   ├── html-css-vars/
│   │   └── index.html               # CSS custom properties demo
│   └── react-next/
│       └── (Next.js App Router demo)
│
├── dist/                            # Generated output (gitignored)
│   ├── index.js                     # ESM bundle
│   ├── index.cjs                    # CJS bundle
│   ├── index.d.ts                   # Bundled type declarations
│   └── react.js                     # React-specific ESM export
│
├── .gitignore
├── .npmignore                       # Exclude src/, tests/, examples/ from npm tarball
├── License                          # Proprietary license
├── package.json
├── tsconfig.json                    # TypeScript config (declarations only)
├── README.md
├── IMPLEMENTATION_PLAN.md           # This document
└── ROADMAP.md                       # Version roadmap (V1 → V2 → V3)
```

---

## 5. File-by-File Breakdown

### `src/index.js` — Main Entry Point

**Purpose:** Re-exports the public API.

```js
export { auto } from './core/engine.js';
export { autoVars } from './adapters/css-vars.js';
export { observe } from './core/observer.js';
```

**Why it exists:** Clean entry point. Bundlers tree-shake unused exports. A developer who only imports `auto` never ships the `observe` or `autoVars` code.

---

### `src/core/engine.js` — The Brain

**Purpose:** Contains the `auto()` function — the entire rule-matching algorithm.

**How it works (step by step):**

1. Call `new Date()` to get the current local time
2. Extract: `hours`, `month` (0-based), `dayOfMonth`, `fullYear`
3. Loop through the `rules` array
4. For each rule, classify it by type:
   - Has `date`? → Check if today matches (exact date or recurring)
   - Has `since` + `until`? → Check if today falls within the range
   - Has `time`? → Store it as a time-of-day candidate
5. Return the highest-priority match using the specificity order
6. If nothing matches → return the `fallback`

**Key design decisions:**
- The function is **pure** — no side effects, no DOM access, no state
- If called on the server (`typeof window === 'undefined'`), it still works because it only uses `Date`, not `window`
- Date ranges handle year wrapping (e.g., `since: '12-01', until: '02-28'` for winter correctly spans December → February)

---

### `src/core/observer.js` — The Live Watcher

**Purpose:** Keeps the theme updated without page reloads.

**How it works:**

1. `observe()` accepts a config with `target`, `rules`, `fallback`, and `interval`
2. Immediately evaluates `auto(rules, fallback)` and applies the result to the target
3. Starts a `setInterval` that re-evaluates every `interval` ms (default 60s)
4. Listens to `document.addEventListener('visibilitychange')` — when the user switches back to the tab, it immediately re-evaluates (no waiting for the next interval tick)
5. Returns `{ stop }` function to clean up the interval and event listener

**Why `setInterval` and not `requestAnimationFrame`?**
- rAF runs at 60fps — checking the clock 60 times per second is absurdly wasteful
- Time boundaries change at most once per hour; 60-second polling is more than sufficient
- `setInterval` is lighter on battery and CPU

---

### `src/core/utils.js` — Date Parsing Helpers

**Purpose:** Pure helper functions used by the engine.

**Functions:**

| Function | Purpose |
|---|---|
| `parseDate(str)` | Parses `"MM-DD"` or `"YYYY-MM-DD"` into `{ month, day, year? }` |
| `isExactDateMatch(rule, now)` | Checks if `now` matches the rule's `date` field |
| `isInDateRange(rule, now)` | Checks if `now` falls between `since` and `until` |
| `getMatchingTimeRule(rules, hour)` | Finds the best time-of-day match for the current hour |
| `isSsr()` | Returns `true` if `typeof window === 'undefined'` |

**Why separate this?** Keeps the engine clean and makes each helper independently testable.

---

### `src/adapters/dom.js` — Class Manipulator

**Purpose:** Applies class-based themes to DOM elements.

**How it works:**

1. Takes a `target` element and the previous/next class strings
2. Splits the previous class string and calls `classList.remove()` for each
3. Splits the next class string and calls `classList.add()` for each
4. Guards against SSR with an `isSsr()` check

**Used by:** `observe()` for continuous class-based theming.

---

### `src/adapters/css-vars.js` — CSS Variable Injector

**Purpose:** Powers the `autoVars()` function.

**How it works:**

1. Evaluates rules (same engine logic) to find the matching `vars` object
2. Loops through the `vars` object's key-value pairs
3. Calls `target.style.setProperty(key, value)` for each
4. Stores the previous keys so it can `removeProperty()` them before applying the new set

---

### `src/react/useAutoTheme.js` — React Hook

**Purpose:** A drop-in React hook that triggers re-renders on time boundaries.

**How it works:**

```js
import { useState, useEffect } from 'react';
import { auto } from '../core/engine.js';

export function useAutoTheme(rules, fallback, options = {}) {
  const { interval = 60000 } = options;
  const [style, setStyle] = useState(() => auto(rules, fallback));

  useEffect(() => {
    const tick = () => setStyle(auto(rules, fallback));
    const id = setInterval(tick, interval);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rules, fallback, interval]);

  return style;
}
```

**Why `react` is a peer dependency (optional):**
- Developers who don't use React never install it
- Developers who do use React already have it — we don't ship a second copy
- The `peerDependenciesMeta.react.optional = true` flag ensures `npm install autotheme` works without React present

---

### `src/types/index.d.ts` — TypeScript Declarations

**Purpose:** Gives TypeScript users full IntelliSense without requiring AutoTheme to be written in TypeScript.

Defines:
- `AutoRule` interface
- `AutoVarRule` interface
- `ObserveConfig` interface
- Function signatures for `auto()`, `autoVars()`, `observe()`, `useAutoTheme()`

---

### `package.json` — Package Configuration

```json
{
  "name": "autotheme-js",
  "version": "1.0.0",
  "description": "Self-driving CSS. Zero-dependency time, date, and seasonal UI theming.",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "types": "./dist/index.d.ts",
      "import": "./dist/react.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.js src/react/useAutoTheme.js --format cjs,esm --dts --clean",
    "test": "node --test tests/*.test.js",
    "prepublishOnly": "npm run test && npm run build"
  },
  "keywords": [
    "css", "tailwind", "bootstrap", "theme", "dark-mode",
    "time-aware", "zero-dependency", "autotheme-js", "react",
    "seasonal", "live-theme", "auto-theme", "theming"
  ],
  "author": "Omid Teimory",
  "license": "SEE LICENSE IN License",
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 6. Build Pipeline

### Local Development

```bash
# Run tests (zero-dep, uses Node.js built-in test runner)
npm test

# Build for distribution
npm run build
```

### What `npm run build` Does

Uses `tsup` (a fast esbuild-based bundler) to:

1. Read `src/index.js` and `src/react/useAutoTheme.js`
2. Output ESM (`.js`) and CJS (`.cjs`) bundles into `dist/`
3. Generate TypeScript declarations (`.d.ts`) from JSDoc annotations
4. Clean the `dist/` folder before each build

### CI/CD (`.github/workflows/publish.yml`)

Triggers on GitHub Release:

1. Checkout code
2. Install dev dependencies
3. Run `npm test`
4. Run `npm run build`
5. Publish to NPM with `npm publish`

---

## 7. Testing Strategy

### Tools

- **Node.js built-in test runner** (`node --test`) — zero dependencies
- **`assert` module** — built into Node.js

### Test Categories

| Category | File | What It Tests |
|---|---|---|
| Engine | `engine.test.js` | Rule matching, specificity sorting, edge cases |
| Utils | `utils.test.js` | Date parsing, range calculations, year wrapping |
| Observer | `observer.test.js` | Interval setup/teardown, visibility events |
| Integration | `integration.test.js` | Full auto() calls with mocked dates |

### How to Mock Time

The engine uses `new Date()`. In tests, we override it:

```js
import { mock } from 'node:test';

// Mock Date to return a specific time
mock.method(global, 'Date', function() {
  return new OriginalDate('2027-01-15T18:30:00');
});
```

### Key Test Cases

- **Time boundary:** Hour 17:59 returns "afternoon", hour 18:00 returns "evening"
- **Date override:** Even if it's 2 PM, a `date: '10-31'` rule wins
- **Range wrapping:** `since: '12-01', until: '02-28'` matches January 15
- **Empty rules:** Returns fallback
- **SSR:** Returns fallback when `typeof window === 'undefined'`
- **Mixed types:** Rules mixing class strings and style objects don't crash

---

## 8. Development Schedule

### Day 1 — Core Engine + Utils

| Task | File |
|---|---|
| Write date parsing helpers | `src/core/utils.js` |
| Write the rule-matching algorithm | `src/core/engine.js` |
| Write the `auto()` function | `src/core/engine.js` |
| Write unit tests for engine + utils | `tests/engine.test.js`, `tests/utils.test.js` |
| Initialize `package.json` | `package.json` |

**Exit Criteria:** `npm test` passes. `auto()` correctly matches time, date, and range rules.

### Day 2 — Adapters + Observer

| Task | File |
|---|---|
| Write DOM class manipulator | `src/adapters/dom.js` |
| Write CSS variable injector | `src/adapters/css-vars.js` |
| Write the `observe()` function | `src/core/observer.js` |
| Write the `autoVars()` function | `src/adapters/css-vars.js` |
| Test observer lifecycle | `tests/observer.test.js` |

**Exit Criteria:** `observe()` starts, ticks, and stops cleanly. `autoVars()` injects/removes CSS variables.

### Day 3 — React Hook + TypeScript

| Task | File |
|---|---|
| Write `useAutoTheme()` hook | `src/react/useAutoTheme.js` |
| Write TypeScript declarations | `src/types/index.d.ts` |
| Write integration tests | `tests/integration.test.js` |
| Configure `tsup` build | `package.json` |

**Exit Criteria:** `npm run build` produces `dist/` with ESM, CJS, and `.d.ts` files. React hook compiles.

### Day 4 — Examples + Documentation

| Task | File |
|---|---|
| Build HTML + Tailwind demo | `examples/html-tailwind/index.html` |
| Build HTML + CSS Vars demo | `examples/html-css-vars/index.html` |
| Write README.md | `README.md` |
| Add JSDoc to all exported functions | All `src/` files |

**Exit Criteria:** Examples work in a browser. README is complete. IDE IntelliSense works.

### Day 5 — Polish + Publish

| Task | File |
|---|---|
| Cross-browser testing | Manual |
| Edge case testing (DST, midnight, year boundary) | `tests/` |
| Write `.npmignore` | `.npmignore` |
| Write CI/CD workflow | `.github/workflows/publish.yml` |
| Publish to NPM | `npm publish` |

**Exit Criteria:** Package is live on NPM. `npm i autotheme-js` installs < 1KB.

---

## 9. NPM Publishing Checklist

Before running `npm publish`:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] `dist/` contains: `index.js`, `index.cjs`, `index.d.ts`, `react.js`
- [ ] `package.json` → `files` field only includes `dist`
- [ ] `package.json` → `exports` map is correct for both ESM and CJS
- [ ] `package.json` → `types` points to `dist/index.d.ts`
- [ ] `README.md` is complete with install, examples, and API reference
- [ ] `License` file is present
- [ ] `.npmignore` excludes `src/`, `tests/`, `examples/`, `.github/`
- [ ] Package name `autotheme` is available on NPM (or scoped `@yourname/autotheme`)
- [ ] Version is set to `1.0.0`
- [ ] SSR safety confirmed (no `window` access outside guards)
- [ ] Zero runtime dependencies confirmed (`dependencies: {}` or absent)

---

*This document is the single source of truth for autotheme-js's implementation. Every decision, every file, every function is here. Build exactly this.*
