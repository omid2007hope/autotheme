# AutoTheme: Vision & Roadmap

## 🌟 The Vision

**AutoTheme** is evolving from "Self-driving CSS" into the **Universal Context Engine** for front-end experiences. Moving beyond simple light/dark mode toggles, AutoTheme will empower interfaces to become truly organic—adapting seamlessly to the user's physical environment.

The digital canvas should reflect the real world. A UI built with AutoTheme shouldn't just know what time it is; it should eventually understand if the sun has set, if it's raining outside, or if the user's device battery is critically low. By providing a zero-dependency, hyper-optimized contextual engine, we enable developers to craft immersive, living applications where the physical world serves as an invisible extension of the digital experience.

---

## 🐛 Known Bugs & Immediate Fixes (v-1.x)

Through a granular line-by-line code audit, several critical issues and edge cases have been identified:

### 1. Engine & Logic Flaws

[x] **Composite Rule Collision (`engine.js` & `css-vars.js`)**:
Rules are evaluated in isolated priority blocks. If a rule specifies both `{ date: '10-31', time: 18 }`, the engine matches the date and immediately returns, ignoring the time condition.
_Fix:_ The engine must evaluate all conditions on a single rule as a logical `AND`.

- **Date Range Year Ignored (`utils.js`)**:
  `isInDateRange` extracts the month and day (`month * 100 + day`) but completely discards the year from `since` and `until`. Passing `"2024-01-01"` acts identically to `"2025-01-01"`.
  _Fix:_ Account for `year` properties if provided, falling back to annual recurrence only when the year is absent.

### 2. React & DOM Adapter Crashes

- **String Split Crash in `applyClasses` (`dom.js`)**:
  When transitioning from inline styles (object) to class-based styles (string), `previousStyle` is passed as an object. `previousClasses.split(/\s+/)` throws a `TypeError`.
  _Fix:_ Add validation: `typeof previousClasses === 'string'` before splitting.
- **React Hook Infinite Loop Trap (`useAutoTheme.js`)**:
  Passing an inline array (`useAutoTheme([{ time: 6, ... }])`) creates a new reference every render. The `useCallback` triggers the `useEffect`, re-evaluating the style and potentially causing infinite render loops if the returned style is an inline object.
  _Fix:_ Implement `useDeepCompareMemoize` or a deep equality check for the `rules` array.
- **Function State Initializer Bug (`useAutoTheme.js`)**:
  Currently using `useState(evaluate)`. If `evaluate` ever returns a function (e.g., a style function payload), React interprets it as an updater function.
  _Fix:_ Change to `useState(() => evaluate())`.

### 3. Architecture & Performance Bottlenecks

- **Timer Drift (`useAutoTheme.js` & `observer.js`)**:
  `setInterval` fires exactly `interval` ms after execution, not at the top of the minute. If a user loads the page at 17:59:45 with a 60s interval, the 18:00 rule won't trigger until 18:00:45.
  _Fix:_ Sync the first tick using `setTimeout` for the remaining milliseconds until the next minute boundary, then start the `setInterval`.
- **Garbage Collection & Sorting Overhead**:
  `engine.js` creates multiple arrays (`exactOneOff`, `dateRanges`, etc.) on _every_ tick. Furthermore, `utils.js` sorts the `timeRules` array descending on every evaluation. `css-vars.js` extracts `Object.keys` in nested loops every minute.
  _Fix:_ Implement a **"Rule Pre-compiler"** phase. When `observe` or `useAutoTheme` mounts, compile and sort the rules once.
- **Timezone Testing Flaw (`css-vars.js`)**:
  `engine.js` accepts `_now` for test mocking, but `css-vars.js` hardcodes `new Date()`, making it impossible to write predictable unit tests for the CSS variable adapter.

---

## 🚀 Roadmap: Version 2 (v-2)

**Theme: Rock-Solid Stability, Advanced Timing, & Developer Experience.**

- [ ] **Engine Optimization (The Compiler)**: Refactor the core to parse, categorize, and sort rules _once_ upon initialization, drastically reducing CPU cycles and GC pauses during the 60-second ticks.
- [ ] **Clock Synchronization**: Implement smart interval timing to ensure re-evaluations fire exactly at the `00` second mark of every minute, eliminating timer drift.
- [ ] **Sunrise & Sunset (Solar Support)**: Introduce `rule.sun` (`'sunrise'`, `'sunset'`). Allow configuration with latitude/longitude coordinates to mathematically calculate precise twilight boundaries.
- [ ] **Timezone Forcing**: Allow developers to inject a specific IANA timezone string (e.g., `'Asia/Tokyo'`). The engine will evaluate rules against the target timezone, regardless of the user's local hardware clock.
- [ ] **Granular Time Arrays & Ranges**: Expand time rules from integers to specific arrays and ranges: `{ time: ['14:30', '18:45'] }` or `{ timeStart: '18:00', timeEnd: '06:00' }`.
- [ ] **Event Lifecycle Hooks**: Add `onThemeChange(newStyle, prevStyle)` to allow side-effects like firing analytics, sound effects, or triggering animations.
- [ ] **CSS Variables Transition Utility**: Ship an optional CSS snippet or JS adapter that automatically appends smooth cross-fade transitions to the `:root` element when `autoVars` triggers.

---

## 🌌 Roadmap: Version 3 (v-3)

**Theme: Universal Context, Pluggable Sensors, & Broad Ecosystem Support.**

- [ ] **Pluggable Architecture (The Context Engine)**: Refactor the engine to accept custom plugins. Move beyond time/date—allow the community to build plugins for _any_ trigger mechanism.
- [ ] **Hardware & Device Sensors**:
  - **Battery Context**: `battery < 20%` triggers an ultra-dark OLED mode to save power (via Battery Status API).
  - **Ambient Light**: Adapt text contrast and background brightness dynamically based on the user's physical room lighting (via Ambient Light Sensor API).
- [ ] **Weather & Environment API Integration**:
  - Optional geolocation/weather plugins. Examples: `{ weather: 'rain' }` triggers a moody, desaturated theme, while `{ weather: 'clear' }` enables vibrant layouts.
- [ ] **Advanced Logic Operators**: Support for explicit complex logic gates in JSON configs: `AND`, `OR`, `NOT` to handle hyper-specific edge cases.
- [ ] **First-Class Framework Ecosystem**:
  - Deliver native wrappers for **Vue (Composables)**, **Svelte (Stores)**, **Angular (Directives)**, and **React Native**.
  - Provide out-of-the-box integration guides for CSS-in-JS libraries (Styled Components, Emotion) and Tailwind v4.
