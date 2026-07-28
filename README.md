<p align="center">
  <img src="https://img.shields.io/badge/ZERO-DEPENDENCIES-000000?style=for-the-badge&labelColor=000000&color=00ffcc" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/<1KB-GZIPPED-000000?style=for-the-badge&labelColor=000000&color=00ffcc" alt="<1KB Gzipped" />
  <img src="https://img.shields.io/badge/100%25-TEST%20COVERAGE-000000?style=for-the-badge&labelColor=000000&color=00ffcc" alt="100% Test Coverage" />
  <img src="https://img.shields.io/npm/l/autotheme?style=for-the-badge&labelColor=000000&color=00ffcc" alt="License" />
</p>

<h1 align="center">AutoTheme</h1>
<h3 align="center">Self-driving CSS.</h3>
<p align="center">
  A microscopic, zero-dependency utility that automatically shifts your<br/>
  <strong>Tailwind · CSS · Bootstrap</strong> styles based on time, date, or season.
</p>
<p align="center">
  Drop in your rules. Walk away. Let the clock design your UI.
</p>

---

## Install

```bash
npm i autotheme
```

## The 5-Second Example

```jsx
import { auto } from "autotheme";

const morning = { time: 6,  style: "bg-amber-100 text-black" };
const evening = { time: 18, style: "bg-zinc-900 text-white" };

export default function App() {
  return (
    <div className={`min-h-screen ${auto([morning, evening], "bg-white")}`}>
      <h1>Your UI now drives itself.</h1>
    </div>
  );
}
```

That's it. **No providers. No context. No config files.** One function. Done.

---

## Why AutoTheme?

| Problem | AutoTheme |
|---|---|
| Writing `new Date()` logic in every component | One `auto()` call inline |
| Maintaining separate dark/light mode state | The clock handles it |
| Seasonal marketing themes (Black Friday, Christmas) | `date: '11-29'` — done |
| Complex `useEffect` + `useState` boilerplate | Zero state. Pure function. |
| Heavy dependencies (moment, dayjs, cron) | **0 dependencies. 0.** |

---

## API Reference

### `auto(rules, fallback?)`

The core function. Pass an array of rules and an optional fallback style. Returns the matching `style` value — a class string or a style object.

```ts
auto(rules: AutoRule[], fallback?: string | object): string | object
```

#### Rule Object Shape

| Key | Type | Description | Example |
|---|---|---|---|
| `time` | `number` | Hour of day (0–23). Active from this hour onward until the next rule. | `time: 18` |
| `date` | `string` | Exact date (`MM-DD`) or full date (`YYYY-MM-DD`). Highest priority. | `date: '10-31'` |
| `since` | `string` | Start of a date range (`MM-DD` or `YYYY-MM-DD`). | `since: '12-01'` |
| `until` | `string` | End of a date range (`MM-DD` or `YYYY-MM-DD`). | `until: '02-28'` |
| `style` | `string \| object` | CSS class string **or** inline style object to apply. | `style: 'bg-black'` |

#### Priority Resolution

When multiple rules match, AutoTheme picks the most specific:

```
Exact Date  →  Date Range (since/until)  →  Time of Day  →  Fallback
```

---

## Usage Patterns

### Tailwind CSS

```jsx
import { auto } from "autotheme";

const rules = [
  { time: 0,  style: "bg-slate-950 text-slate-100" },  // Midnight
  { time: 6,  style: "bg-amber-50 text-amber-900" },   // Morning
  { time: 12, style: "bg-white text-black" },           // Afternoon
  { time: 18, style: "bg-indigo-950 text-indigo-100" }, // Evening
];

<div className={auto(rules, "bg-gray-100")} />
```

### Standard CSS (Inline Styles)

```jsx
import { auto } from "autotheme";

const rules = [
  { time: 6,  style: { backgroundColor: "#fffbeb", color: "#78350f" } },
  { time: 18, style: { backgroundColor: "#0f172a", color: "#e2e8f0" } },
];

<div style={auto(rules, { backgroundColor: "#ffffff" })} />
```

### Bootstrap

```jsx
import { auto } from "autotheme";

const rules = [
  { time: 6,  style: "bg-light text-dark" },
  { time: 18, style: "bg-dark text-light" },
];

<div className={auto(rules, "bg-white")} />
```

### CSS Custom Properties (Variables)

```js
import { autoVars } from "autotheme";

autoVars([
  { time: 6,  vars: { "--bg": "#fffbeb", "--text": "#78350f", "--radius": "8px" } },
  { time: 18, vars: { "--bg": "#0f172a", "--text": "#e2e8f0", "--radius": "12px" } },
]);
```

This injects variables directly into `:root`, letting your existing CSS cascade handle the rest.

### Date & Seasonal Overrides

```jsx
import { auto } from "autotheme";

const rules = [
  // Halloween — takes priority on Oct 31
  { date: "10-31", style: "bg-orange-600 text-black" },

  // Winter range — Dec 1 through Feb 28 (recurring annually)
  { since: "12-01", until: "02-28", style: "bg-sky-100 text-sky-900" },

  // Summer range
  { since: "06-01", until: "08-31", style: "bg-yellow-50 text-amber-800" },

  // Default time-of-day rules
  { time: 6,  style: "bg-white text-black" },
  { time: 18, style: "bg-zinc-900 text-white" },
];

<div className={auto(rules, "bg-gray-50")} />
```

### Exact Date (One-Off Events)

```jsx
// Black Friday 2027
{ date: "2027-11-26", style: "bg-black text-yellow-400 font-bold" }

// New Year's Day (every year)
{ date: "01-01", style: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" }
```

---

## React Hook — Live Updates

If the user leaves the tab open and the clock crosses a time boundary, the `auto()` function alone won't re-render. For **live, automatic re-renders**, use the React hook:

```jsx
import { useAutoTheme } from "autotheme/react";

const rules = [
  { time: 6,  style: "bg-white text-black" },
  { time: 18, style: "bg-zinc-900 text-white" },
];

export default function App() {
  const currentStyle = useAutoTheme(rules, "bg-gray-100");

  return (
    <div className={`min-h-screen ${currentStyle}`}>
      <h1>This updates live. No reload needed.</h1>
    </div>
  );
}
```

The hook internally ticks every 60 seconds (configurable) and re-evaluates rules. It also responds to `visibilitychange` events — so when the user switches back to the tab, it immediately checks the clock.

```jsx
// Custom interval (check every 30 seconds)
const style = useAutoTheme(rules, fallback, { interval: 30000 });
```

---

## Vanilla JS / HTML5

No React? No problem. Use the DOM observer directly:

```html
<script type="module">
  import { observe } from "autotheme";

  observe({
    target: document.documentElement,
    rules: [
      { time: 6,  style: "light-theme" },
      { time: 18, style: "dark-theme" },
    ],
    fallback: "light-theme",
    interval: 60000,
  });
</script>
```

This adds/removes classes on the target element automatically.

---

## SSR Safety

AutoTheme is fully safe for **Next.js**, **Nuxt**, **Remix**, **Astro**, and any SSR/SSG framework. When `typeof window === 'undefined'`, the engine returns the **fallback** value instead of crashing.

```jsx
// Works perfectly in Next.js App Router
// Server render gets the fallback; client hydration picks the real theme
<div className={auto(rules, "bg-white")}>
```

---

## Framework Compatibility

| Framework | Support | Method |
|---|---|---|
| **React** | ✅ | `auto()` + `useAutoTheme()` hook |
| **Next.js** | ✅ | SSR-safe, hydrates correctly |
| **Vue** | ✅ | `auto()` in `:class` bindings |
| **Svelte** | ✅ | `auto()` in `class:` directives |
| **Astro** | ✅ | `auto()` in `client:load` components |
| **Vanilla JS** | ✅ | `auto()` + `observe()` DOM observer |
| **HTML5** | ✅ | `<script type="module">` import |

| CSS Framework | Support |
|---|---|
| **Tailwind CSS** | ✅ Full class swapping |
| **Bootstrap** | ✅ Full class swapping |
| **Standard CSS** | ✅ Inline styles + CSS variables |

---

## Package Stats

| Metric | Value |
|---|---|
| Runtime dependencies | **0** |
| Gzipped size | **< 1KB** |
| Module formats | ESM + CommonJS |
| TypeScript | Full `.d.ts` declarations |
| Node.js test runner | Built-in, zero-dep |
| SSR / SSG | Fully safe |
| Browser support | All modern browsers |

---

## Contributing

This project is currently under active development. Contribution guidelines will be published with the v1.0 stable release.

---

## License

Copyright © 2026 Omid Teimory. All rights reserved.

See [LICENSE](./License) for details.
