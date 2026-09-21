/**
 * Regression tests for GitHub Issues #3, #4, #5, #7, #8.
 * Each describe block maps to a specific issue.
 */

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { auto, compile } from "../src/core/engine.js";

// ---------------------------------------------------------------------------
// Issue #3 — Falsy style values must NOT be treated as "no match"
// ---------------------------------------------------------------------------
describe("Issue #3: falsy style values are returned, not skipped", () => {
  it("empty string style from a time rule is returned (not skipped to fallback)", () => {
    const rules = [{ time: 0, style: "" }];
    const now = new Date(2027, 6, 15, 10, 0, 0);
    assert.strictEqual(auto(rules, "fallback", now), "");
  });

  it("empty string style from a date rule is returned (not skipped to time rules)", () => {
    const rules = [
      { date: "07-15", style: "" },
      { time: 6, style: "morning" },
    ];
    const now = new Date(2027, 6, 15, 10, 0, 0); // July 15
    assert.strictEqual(auto(rules, "fallback", now), "");
  });

  it("empty string style from a date range rule is returned (not skipped to time rules)", () => {
    const rules = [
      { since: "07-01", until: "07-31", style: "" },
      { time: 6, style: "morning" },
    ];
    const now = new Date(2027, 6, 15, 10, 0, 0); // July 15
    assert.strictEqual(auto(rules, "fallback", now), "");
  });

  it('null is reserved for "no match" — does not conflict with valid falsy styles', () => {
    // If the date rule is a one-off and matches, its style (even '') should win
    const rules = [
      { date: "2027-07-15", style: "" },
      { time: 0, style: "time-fallback" },
    ];
    const now = new Date(2027, 6, 15, 12, 0, 0);
    assert.strictEqual(auto(rules, "default-fallback", now), "");
  });
});

// ---------------------------------------------------------------------------
// Issue #4 — compile() must be importable from the public entry point
// ---------------------------------------------------------------------------
describe("Issue #4: compile() is exported from src/index.js", async () => {
  it("compile can be imported from the package entry point", async () => {
    const mod = await import("../src/index.js");
    assert.strictEqual(typeof mod.compile, "function");
  });

  it("pre-compiled rules are not re-compiled (auto() short-circuits on __compiled)", () => {
    const rules = [{ time: 6, style: "morning" }];
    const compiled = compile(rules);
    const compiledAgain = compile(compiled); // must return same ref
    assert.strictEqual(compiled, compiledAgain);
  });
});

// ---------------------------------------------------------------------------
// Issue #5 — { since, until, time } composite rules must be routed to dateRanges
// ---------------------------------------------------------------------------
describe("Issue #5: { since, until, time } composite rules", () => {
  it("compile() routes composite range+time rule to dateRanges (not timeRules)", () => {
    const rules = [
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
      { time: 6, style: "light" },
    ];
    const compiled = compile(rules);
    assert.strictEqual(compiled.dateRanges.length, 1);
    assert.strictEqual(compiled.timeRules.length, 1);
    // dateRanges rule must have _minutes precomputed
    assert.strictEqual(compiled.dateRanges[0]._minutes, 18 * 60);
  });

  it("composite rule only activates inside the date range", () => {
    const rules = [
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
      { time: 6, style: "light" },
    ];
    // Dec 15 at 20:00 → inside range AND past time:18 → composite rule wins
    const inRange = new Date(2027, 11, 15, 20, 0, 0);
    assert.strictEqual(auto(rules, "fallback", inRange), "dark-winter-evening");
  });

  it("composite rule does NOT activate outside the date range", () => {
    const rules = [
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
      { time: 6, style: "light" },
    ];
    // May 15 at 20:00 → outside date range → falls to time rule
    const outOfRange = new Date(2027, 4, 15, 20, 0, 0);
    assert.strictEqual(auto(rules, "fallback", outOfRange), "light");
  });

  it("composite rule with a single time, inside range before the hour — wraps to that rule (only one time boundary)", () => {
    // With only one range+time rule, the wrap-around logic makes it active all day within range.
    // This is consistent with how time:18 alone acts as the sole time rule.
    const rules = [
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
    ];
    // Dec 15 at 14:00 — inside range. Only one time boundary → wraps to it.
    const inRangeBefore = new Date(2027, 11, 15, 14, 0, 0);
    assert.strictEqual(
      auto(rules, "fallback", inRangeBefore),
      "dark-winter-evening",
    );
  });

  it("two composite rules restrict correctly — morning range + evening range, inside range before evening time", () => {
    // Add a day companion to restrict: morning gets 'light', evening gets 'dark-winter-evening'
    const rules = [
      { since: "12-01", until: "02-28", time: 6, style: "light-winter-day" },
      {
        since: "12-01",
        until: "02-28",
        time: 18,
        style: "dark-winter-evening",
      },
      { time: 6, style: "light" },
    ];
    // Dec 15 at 14:00 — inside range, between time:6 and time:18 → light-winter-day wins
    const inRangeMorning = new Date(2027, 11, 15, 14, 0, 0);
    assert.strictEqual(
      auto(rules, "fallback", inRangeMorning),
      "light-winter-day",
    );

    // Dec 15 at 20:00 — inside range, past time:18 → dark-winter-evening
    const inRangeEvening = new Date(2027, 11, 15, 20, 0, 0);
    assert.strictEqual(
      auto(rules, "fallback", inRangeEvening),
      "dark-winter-evening",
    );
  });
});

// ---------------------------------------------------------------------------
// Issue #7 & #8 — Invalid rules must emit console.warn, not silently drop
// ---------------------------------------------------------------------------
describe("Issue #7/#8: invalid rules emit console.warn", () => {
  it("warns when date string is too short", () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    compile([{ date: "1-1", style: "halloween" }]);

    console.warn = origWarn;
    assert.ok(warnings.length > 0, "expected at least one console.warn call");
    assert.ok(
      warnings[0].includes("[autotheme]"),
      `warn should include [autotheme], got: ${warnings[0]}`,
    );
  });

  it("warns when time is out of 0–23 range", () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    compile([{ time: 24, style: "invalid" }]);

    console.warn = origWarn;
    assert.ok(warnings.length > 0, "expected at least one console.warn call");
  });

  it("warns when since is provided without until", () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    compile([{ since: "12-01", style: "invalid" }]);

    console.warn = origWarn;
    assert.ok(warnings.length > 0, "expected at least one console.warn call");
  });

  it("warns when until is provided without since", () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));

    compile([{ until: "02-28", style: "invalid" }]);

    console.warn = origWarn;
    assert.ok(warnings.length > 0, "expected at least one console.warn call");
  });

  it("regression: invalid rule returns fallback (does not throw)", () => {
    const origWarn = console.warn;
    console.warn = () => {}; // silence for this test

    let result;
    assert.doesNotThrow(() => {
      result = auto([{ date: "1-1", style: "halloween" }], "default");
    });
    assert.strictEqual(result, "default");

    console.warn = origWarn;
  });
});

// ---------------------------------------------------------------------------
// Issue #T03 — Prevent Unhandled Crashes on null Rules & Non-String Dates
// ---------------------------------------------------------------------------
describe("Issue #T03: Prevent unhandled crashes on null rules and non-string dates", () => {
  it("compile() safely ignores falsy or null rules without crashing", () => {
    let result;
    assert.doesNotThrow(() => {
      result = compile([null, undefined, false, 0, "", { time: 6, style: "morning" }]);
    });
    assert.strictEqual(result.timeRules.length, 1);
  });

  it("compile() safely ignores rules with non-string date values without crashing", () => {
    const origWarn = console.warn;
    console.warn = () => {}; // silence warnings

    let result;
    assert.doesNotThrow(() => {
      result = compile([
        { date: 20271031, style: "number-date" },
        { date: {}, style: "object-date" },
        { since: 1201, until: 2028, style: "number-range" },
      ]);
    });
    
    assert.doesNotThrow(() => {
      auto([{ date: 20271031, style: "number-date" }], "fallback", new Date());
    });

    console.warn = origWarn;
  });
});
