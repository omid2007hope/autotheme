# AutoTheme — Roadmap

> **Self-driving CSS. Zero dependencies. Infinite possibilities.**

This roadmap covers the full lifecycle of AutoTheme from **V1** (launch) through **V2** (ecosystem expansion) and **V3** (intelligence layer). Each version includes features, growth strategy, and adoption milestones.

---

## Version Overview

| Version | Codename | Focus | Target |
|---|---|---|---|
| **V1.0** | Genesis | Core engine + ship it | This week |
| **V1.x** | Traction | Polish + community growth | Weeks 2–4 |
| **V2.0** | Ecosystem | Framework plugins + advanced rules | Month 2–3 |
| **V3.0** | Intelligence | Geo-aware, AI-assisted, analytics | Month 4–6 |

---

## V1.0 — Genesis

> **Goal:** Ship a working, polished, zero-dependency NPM package that solves the core problem perfectly.

### Features

- [x] `auto()` — Core rule-matching function
- [x] Time-of-day rules (`time: 18`)
- [x] Exact date rules (`date: '10-31'`)
- [x] Date range / seasonal rules (`since: '12-01', until: '02-28'`)
- [x] Specificity-based priority resolution
- [x] Tailwind CSS support (class string swapping)
- [x] Bootstrap support (class string swapping)
- [x] Standard CSS support (inline style objects)
- [x] `autoVars()` — CSS custom properties injection
- [x] `observe()` — DOM observer for vanilla JS / HTML5
- [x] `useAutoTheme()` — React hook with live updates
- [x] SSR/SSG safety (Next.js, Nuxt, Remix, Astro)
- [x] TypeScript declarations (`.d.ts`)
- [x] ESM + CommonJS dual build
- [x] Node.js built-in test runner (zero-dep tests)
- [x] < 1KB gzipped
- [x] 0 runtime dependencies

### Popularity Actions (Launch Week)

| Action | Platform | Goal |
|---|---|---|
| **"Show HN" post** | Hacker News | Hit front page. Title: *"AutoTheme – Self-driving CSS. 1KB, zero dependencies, time-aware theming."* |
| **r/webdev showcase** | Reddit | Pain-point framing: *"I got tired of writing Date logic for seasonal themes, so I built a 1KB zero-dep utility."* |
| **r/reactjs post** | Reddit | Hook-focused demo with `useAutoTheme()` |
| **Dev.to article** | Dev.to | *"How I Made My Portfolio Change Themes Based on the Time of Day"* |
| **X/Twitter thread** | X (Twitter) | 30-second screen recording of a site shifting live + code snippet. Tag Tailwind, React, and Vercel accounts. |
| **Product Hunt launch** | Product Hunt | Developer Tools category. Push upvotes in the first 2 hours. |

### Success Metrics

| Metric | Target |
|---|---|
| NPM weekly downloads | 500+ |
| GitHub stars | 100+ |
| Working examples | 3+ (Tailwind, CSS, React) |

---

## V1.1 — Quick Wins (Week 2)

> **Goal:** Respond to early feedback. Fix rough edges. Add the most-requested features.

### Features

- [ ] **Day-of-week rules** — `day: 'friday'` or `day: [1, 5]` (Mon–Fri)
- [ ] **Minute-precision time** — `time: '18:30'` in addition to `time: 18`
- [ ] **`force()` override** — Let developers manually force a theme for testing / debugging
- [ ] **`destroy()` cleanup** — Full teardown for SPA route changes
- [ ] **Verbose logging mode** — `auto(rules, fallback, { debug: true })` logs which rule matched and why

### Popularity Actions

| Action | Platform |
|---|---|
| Respond to every GitHub issue within 24 hours | GitHub |
| Submit to `awesome-react` list | GitHub |
| Submit to `awesome-tailwindcss` list | GitHub |
| Create a CodeSandbox / StackBlitz starter template | CodeSandbox |

---

## V1.2 — Developer Experience (Week 3–4)

> **Goal:** Make the package feel premium. Full IDE IntelliSense. Interactive docs.

### Features

- [ ] **Interactive documentation site** — Hosted on Vercel (`autotheme.dev`). The site's own colors shift based on the visitor's local time.
- [ ] **CodePen / StackBlitz embed** in README — One-click playground
- [ ] **Comprehensive JSDoc annotations** — Every function, parameter, and return type fully documented so IDEs light up
- [ ] **Error messages** — Human-readable warnings for invalid rules (e.g., `time: 25` logs a clear warning)
- [ ] **Changelog** — `CHANGELOG.md` for every release

### Popularity Actions

| Action | Platform |
|---|---|
| Write tutorial: *"Time-Aware Styling in Next.js 14 with @omid2007hope/autotheme"* | Dev.to / Medium |
| Write tutorial: *"Seasonal CSS Without JavaScript State"* | Dev.to / Medium |
| Create YouTube short / TikTok dev video | Social media |

### Success Metrics

| Metric | Target |
|---|---|
| NPM weekly downloads | 2,000+ |
| GitHub stars | 500+ |
| Docs site live | autotheme.dev |

---

## V2.0 — Ecosystem

> **Goal:** Expand beyond the core function into framework-specific plugins and advanced rule types.

### Features

#### Framework Plugins
- [ ] **Vue composable** — `useAutoTheme()` for Vue 3 Composition API
- [ ] **Svelte store** — Reactive Svelte store that updates on time boundaries
- [ ] **Angular directive** — `[autoTheme]` attribute directive
- [ ] **Astro integration** — `@autotheme/astro` with island support
- [ ] **Solid.js signal** — `createAutoTheme()` signal primitive

#### Advanced Rule Types
- [ ] **Custom condition functions** — `when: (now) => now.getDay() === 0` for full control
- [ ] **Nested rules** — Combine time + date (e.g., "on Halloween, but only after 6 PM")
- [ ] **Transition support** — `transition: 'fade 500ms'` — smooth CSS transitions between theme shifts
- [ ] **Easing presets** — Built-in transition curves for theme changes

#### Theme Presets
- [ ] **Built-in seasonal presets** — `import { presets } from '@omid2007hope/autotheme'` — winter, summer, autumn, spring with pre-designed Tailwind class sets
- [ ] **Dark/Light auto-toggle** — One-line setup: `auto.darkLight()` — switches at 6 AM / 6 PM
- [ ] **Holiday pack** — Pre-built rules for major holidays (Christmas, Halloween, New Year, Valentine's, etc.)

#### Developer Tooling
- [ ] **Chrome DevTools extension** — Visual timeline showing which rule is active and when the next shift will happen
- [ ] **ESLint plugin** — Warns about invalid rules at lint time (e.g., overlapping ranges, invalid hours)

### Popularity Actions

| Action | Platform |
|---|---|
| Launch V2 on Product Hunt (again) | Product Hunt |
| Conference lightning talk pitch | React Conf / Next.js Conf / CSS Day |
| Sponsor a Tailwind CSS newsletter issue | Tailwind Weekly |
| Write: *"Building a Time-Aware E-Commerce Storefront"* case study | Blog |
| Partner with Tailwind UI / ShadCN for example integrations | Partnerships |

### Success Metrics

| Metric | Target |
|---|---|
| NPM weekly downloads | 10,000+ |
| GitHub stars | 2,000+ |
| Framework adapters | 5+ (React, Vue, Svelte, Angular, Solid) |
| Community PRs | 20+ |

---

## V3.0 — Intelligence

> **Goal:** Move from "time-aware" to "context-aware." The package doesn't just know the *time* — it knows the *environment*.

### Features

#### Geo-Aware Theming
- [ ] **Sunrise/sunset engine** — Pure math (no API calls, no dependencies). Given latitude/longitude, calculate actual sunrise and sunset times. Theme shifts when the *sun* sets, not at a fixed hour.
- [ ] **Weather-aware hooks** (optional, opt-in API) — If the developer provides a weather API key, AutoTheme can apply "rainy day" or "sunny day" themes based on real conditions
- [ ] **Hemisphere-aware seasons** — Automatically flip season months for Southern Hemisphere users

#### Smart Defaults
- [ ] **Zero-config mode** — `import 'autotheme/auto'` — No rules needed. Automatically applies sensible dark/light switching based on local time + optional geo.
- [ ] **AI-assisted theme generation** — Pass your brand colors, and AutoTheme generates the full seasonal/time palette automatically (via LLM API, opt-in)

#### Performance & Scale
- [ ] **Web Worker mode** — Move the time-checking interval off the main thread for large-scale applications
- [ ] **Edge runtime support** — Verified compatibility with Cloudflare Workers, Vercel Edge, Deno Deploy

#### Analytics & Insights
- [ ] **Theme analytics** — Opt-in telemetry: *"60% of your users see the dark theme. 15% see the holiday theme."* — helps marketing teams understand which themes users actually experience
- [ ] **A/B theme testing** — Split users into theme groups and measure engagement differences

#### Ecosystem
- [ ] **Community theme marketplace** — Open-source repository of community-contributed theme presets and rule packs
- [ ] **Figma plugin** — Design-time preview of how a component looks across all time/date/season rules
- [ ] **Storybook addon** — Simulate time shifts inside Storybook to preview all theme states

### Popularity Actions

| Action | Platform |
|---|---|
| "AutoTheme V3: Context-Aware CSS" launch post | Hacker News, Reddit, X |
| Full conference talk: *"Beyond Dark Mode: Context-Aware Interfaces"* | JSConf, CSSConf, React Summit |
| Partnerships with Vercel, Netlify, Cloudflare for "featured integration" | Platform partnerships |
| Open-source case studies with real companies | Blog + GitHub |

### Success Metrics

| Metric | Target |
|---|---|
| NPM weekly downloads | 50,000+ |
| GitHub stars | 10,000+ |
| Used in production by | 100+ companies |
| Community contributors | 50+ |
| Framework adapters | 8+ |

---

## Growth Flywheel

The entire popularity strategy follows one principle: **reduce friction at every step.**

```
                   ┌──────────────────────────┐
                   │                          │
                   │     Developer sees a     │
                   │     tweet / HN post      │
                   │                          │
                   └─────────────┬────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │                          │
                   │  Clicks README — sees    │
                   │  5-line code example     │
                   │  + animated GIF          │
                   │                          │
                   └─────────────┬────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │                          │
                   │  npm i @omid2007hope/autotheme         │
                   │  (< 1KB, 0 deps)         │
                   │  installs in 0.2 seconds │
                   │                          │
                   └─────────────┬────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │                          │
                   │  Copies the 5-line       │
                   │  example into their app  │
                   │  — it works instantly    │
                   │                          │
                   └─────────────┬────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │                          │
                   │  Tweets about it         │
                   │  Stars the repo          │
                   │  Tells a coworker        │
                   │                          │
                   └─────────────┬────────────┘
                                 │
                                 └───────────────── (loop)
```

### The 3 Golden Rules of Open-Source Growth

1. **Ride the Tailwind wave.** Tailwind CSS is incredibly popular. Position AutoTheme as *"the missing time-engine for Tailwind CSS."* Piggyback off their search volume — it's the fastest path to discovery.

2. **Never argue, just solve.** When a senior dev on Hacker News says *"I could write this with a Date object"* — agree. Respond: *"You absolutely can! I just got tired of rewriting the since/until boundary logic for every project, so I wrapped it in a 1KB drop-in."*

3. **The donkey-proof API is your weapon.** Do not add complex configs. The moment you require a `<ThemeProvider>` wrapper or a 50-line config file, developers bounce. Keep it at `auto([{ time: 18, style: 'bg-black' }])` — forever.

---

## Non-Negotiable Principles (All Versions)

| Principle | Rule |
|---|---|
| **Zero dependencies** | Never add a runtime dependency. Ever. Not even a 2KB utility. |
| **Sub-1KB core** | The `auto()` function must always ship under 1KB gzipped. |
| **5-second onboarding** | A developer must be able to go from `npm i` to working code in under 5 seconds by copying the README example. |
| **No breaking changes in minor versions** | Follow strict semver. V1.x rules always work in V1.(x+1). |
| **SSR-safe by default** | Every export must handle `typeof window === 'undefined'` gracefully. |
| **Framework-agnostic core** | The `auto()` function never imports React, Vue, or any framework. Framework adapters are separate entry points. |

---

## Timeline Summary

```
Week 1          Week 2–4        Month 2–3       Month 4–6
  │                │                │                │
  ▼                ▼                ▼                ▼
┌──────┐      ┌──────────┐    ┌──────────┐    ┌──────────┐
│ V1.0 │      │ V1.1–1.2 │    │  V2.0    │    │  V3.0    │
│      │      │          │    │          │    │          │
│Core  │ ──▶  │Polish +  │ ──▶│Ecosystem │ ──▶│Intelli-  │
│Engine│      │Community │    │Expansion │    │gence     │
│Ship  │      │Growth    │    │Framework │    │Geo-aware │
│It    │      │Quick Wins│    │Plugins   │    │Analytics │
└──────┘      └──────────┘    └──────────┘    └──────────┘
  500/wk        2,000/wk       10,000/wk       50,000/wk
  100 ⭐          500 ⭐         2,000 ⭐        10,000 ⭐
```

---

*This roadmap is a living document. Features and timelines will be adjusted based on community feedback and adoption velocity.*
