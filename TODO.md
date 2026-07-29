# AutoTheme: Vision & Roadmap

## 🌟 The Vision
**AutoTheme** aims to be the universal, framework-agnostic standard for contextual UI theming. Moving beyond a simple toggle between light and dark modes, AutoTheme is designed to craft immersive experiences that organically adapt to the user's real-world environment. By providing "self-driving CSS" with zero dependencies, AutoTheme empowers developers to build digital interfaces that feel alive—responding not just to the clock and calendar, but eventually to sunlight, weather, and precise geolocation. 

Our goal is to make the physical world an invisible extension of the digital canvas, natively and effortlessly.

---

## 🐛 Known Bugs & Immediate Fixes (v-1.x)
- **Composite Rule Collision (`engine.js` & `css-vars.js`)**: 
  Currently, rules are evaluated in isolated `if / else if` blocks based on priority. If a rule has both a `date` and a `time` (e.g., Halloween after 6 PM: `{ date: '10-31', time: 18 }`), the engine resolves the `date` first and completely ignores the `time`. 
  *Fix:* Engine needs to evaluate all present conditions on a rule as a logical `AND`.
- **String Split Crash in `applyClasses` (`dom.js`)**:
  When transitioning from inline styles (an object payload) to class-based styles (a string payload) within `observe.js`, `previousStyle` could be an object. Calling `previousClasses.split(/\s+/)` in `applyClasses` will crash the application.
  *Fix:* Validate `typeof previousClasses === 'string'` before attempting to split.
- **Date Range Year Ignored (`utils.js`)**:
  The `isInDateRange` function parses `since` and `until` but only compares `month * 100 + day`. If a user passes a specific year (e.g., `"2024-01-01"` to `"2024-01-31"`), the year is completely ignored, turning it into an annually recurring rule. 
  *Fix:* Account for `year` properties if provided, falling back to annual recurrence only when the year is omitted.
- **React Hook Re-render Trap (`useAutoTheme.js`)**:
  If a developer passes `rules` as an inline array literal (e.g., `useAutoTheme([{ time: 6, style: 'light' }])`), the `useCallback` dependency array will see a new reference every render, potentially leading to infinite re-evaluation loops.
  *Fix:* Implement a deep equality check (or `useDeepCompareMemoize`) for the `rules` array.

---

## 🚀 Roadmap: Version 2 (v-2)
**Focus: Rock-solid stability, advanced scheduling, and developer experience.**

- [ ] **Sunrise & Sunset Support**: Introduce `rule.sun` (`'sunrise'`, `'sunset'`, `'dawn'`, `'dusk'`). Allow users to pass latitude/longitude coordinates to mathematically calculate twilight bounds.
- [ ] **Event Listeners / Callbacks**: Add `onThemeChange(newStyle, previousStyle)` to both `observe()` and `useAutoTheme()` configurations to allow triggering side-effects (e.g., playing a sound, firing analytics).
- [ ] **Timezone Offsets**: Support providing a specific IANA timezone string to force the theme engine to operate in a specific timezone regardless of the user's local clock.
- [ ] **CSS Variable Transitions**: Ship an optional adapter utility that automatically appends smooth CSS transitions to `root` when injecting CSS variables via `autoVars`.
- [ ] **Granular Time Rules**: Expand `time` rules to support specific minutes and arrays, e.g., `{ time: '14:30' }` or time ranges `{ timeStart: 18, timeEnd: 6 }`.

---

## 🌌 Roadmap: Version 3 (v-3)
**Focus: Contextual environmental awareness, plugins, and ecosystem expansion.**

- [ ] **Plugin Architecture**: Refactor the core evaluation engine to support custom logic plugins. This will enable community-driven rule triggers.
- [ ] **Device & Context Adapters**: 
  - `battery < 20%` (Engage ultra-dark OLED mode to save power).
  - `ambientLight` sensor integration (Adapt contrast based on physical room lighting).
- [ ] **Weather & Geolocation Integration**: Optional plugins to fetch local weather (e.g., `{ weather: 'rain' }` triggers a moody, blue-tinted theme, while `{ weather: 'clear' }` brings out bright, vibrant colors).
- [ ] **Advanced Logic Operators**: Support for explicit `AND`, `OR`, and `NOT` composite rules within the JSON configuration.
- [ ] **Full Ecosystem Support**: Deliver native, first-class hooks and directives for **Vue, Svelte, Angular, and React Native**, alongside first-class support for CSS-in-JS libraries (Styled Components, Emotion).
