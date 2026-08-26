import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auto } from '../src/core/engine.js';

// ============================================================
// Neo-Noir Auto Theme — 1440 Minute Resolution
// Extreme temperature contrasts: synthetic cool × dirty warm
// ============================================================

// --- Interpolation Helpers (module-private) ---
const _lerp = (a, b, t) => a + (b - a) * t;
const _clamp = (v) => Math.min(Math.max(Math.round(v), 0), 255);
const _lerpRGB = (c1, c2, t) => c1.map((v, i) => _clamp(_lerp(v, c2[i], t)));
const _hex = (rgb) =>
  '#' +
  rgb
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
const _r2 = (n) => Math.round(n * 100) / 100;
const _ts = (m) =>
  `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const _fill = (style) =>
  Array.from({ length: 1440 }, (_, i) => ({ time: _ts(i), style }));

// --- 24 Hourly Neo-Noir Keyframes ---
const _K = [
  /* 00 */ { r1: [30, 27, 75], a1: 0.2, r2: [34, 211, 238], a2: 0.06, g1: [4, 6, 20], g2: [3, 5, 14], g3: [0, 0, 2], s1: 32, s2: 24, mp: 42 },
  /* 01 */ { r1: [30, 27, 75], a1: 0.16, r2: [34, 211, 238], a2: 0.05, g1: [3, 5, 18], g2: [2, 4, 12], g3: [0, 0, 2], s1: 30, s2: 24, mp: 42 },
  /* 02 */ { r1: [24, 24, 68], a1: 0.14, r2: [20, 184, 166], a2: 0.05, g1: [3, 4, 16], g2: [2, 3, 10], g3: [0, 0, 2], s1: 30, s2: 24, mp: 42 },
  /* 03 */ { r1: [24, 24, 68], a1: 0.14, r2: [52, 211, 153], a2: 0.06, g1: [2, 4, 14], g2: [2, 3, 10], g3: [0, 0, 2], s1: 30, s2: 25, mp: 42 },
  /* 04 */ { r1: [88, 28, 135], a1: 0.16, r2: [52, 211, 153], a2: 0.08, g1: [6, 4, 18], g2: [4, 3, 14], g3: [1, 0, 4], s1: 32, s2: 25, mp: 42 },
  /* 05 */ { r1: [192, 38, 211], a1: 0.18, r2: [34, 211, 238], a2: 0.1, g1: [10, 6, 24], g2: [8, 4, 18], g3: [2, 0, 6], s1: 34, s2: 25, mp: 42 },
  /* 06 */ { r1: [245, 158, 11], a1: 0.18, r2: [34, 211, 238], a2: 0.12, g1: [14, 10, 26], g2: [10, 8, 22], g3: [2, 1, 6], s1: 35, s2: 25, mp: 42 },
  /* 07 */ { r1: [251, 146, 60], a1: 0.22, r2: [34, 211, 238], a2: 0.14, g1: [16, 12, 28], g2: [12, 10, 24], g3: [3, 2, 8], s1: 36, s2: 26, mp: 44 },
  /* 08 */ { r1: [253, 224, 71], a1: 0.2, r2: [217, 70, 239], a2: 0.1, g1: [14, 14, 30], g2: [10, 10, 24], g3: [2, 2, 8], s1: 36, s2: 26, mp: 44 },
  /* 09 */ { r1: [34, 211, 238], a1: 0.22, r2: [52, 211, 153], a2: 0.12, g1: [8, 16, 36], g2: [6, 12, 28], g3: [1, 3, 10], s1: 38, s2: 28, mp: 46 },
  /* 10 */ { r1: [56, 189, 248], a1: 0.26, r2: [34, 211, 238], a2: 0.16, g1: [6, 20, 42], g2: [4, 14, 32], g3: [1, 4, 14], s1: 38, s2: 28, mp: 48 },
  /* 11 */ { r1: [14, 165, 233], a1: 0.28, r2: [20, 184, 166], a2: 0.18, g1: [4, 22, 48], g2: [3, 16, 36], g3: [1, 4, 16], s1: 40, s2: 30, mp: 50 },
  /* 12 */ { r1: [14, 165, 233], a1: 0.3, r2: [56, 189, 248], a2: 0.18, g1: [4, 20, 46], g2: [3, 15, 34], g3: [1, 4, 14], s1: 40, s2: 30, mp: 55 },
  /* 13 */ { r1: [14, 165, 233], a1: 0.26, r2: [99, 102, 241], a2: 0.14, g1: [5, 18, 42], g2: [4, 14, 32], g3: [1, 3, 12], s1: 38, s2: 28, mp: 50 },
  /* 14 */ { r1: [99, 102, 241], a1: 0.24, r2: [139, 92, 246], a2: 0.14, g1: [6, 14, 38], g2: [5, 12, 28], g3: [1, 2, 10], s1: 36, s2: 26, mp: 48 },
  /* 15 */ { r1: [139, 92, 246], a1: 0.24, r2: [217, 70, 239], a2: 0.14, g1: [10, 10, 36], g2: [8, 8, 28], g3: [2, 1, 10], s1: 36, s2: 26, mp: 45 },
  /* 16 */ { r1: [217, 70, 239], a1: 0.24, r2: [244, 114, 182], a2: 0.16, g1: [14, 8, 38], g2: [12, 6, 30], g3: [3, 1, 10], s1: 35, s2: 25, mp: 44 },
  /* 17 */ { r1: [217, 70, 239], a1: 0.26, r2: [249, 115, 22], a2: 0.18, g1: [18, 6, 40], g2: [16, 4, 32], g3: [4, 1, 10], s1: 35, s2: 25, mp: 42 },
  /* 18 */ { r1: [249, 115, 22], a1: 0.24, r2: [217, 70, 239], a2: 0.18, g1: [22, 6, 42], g2: [18, 4, 34], g3: [4, 1, 12], s1: 35, s2: 25, mp: 42 },
  /* 19 */ { r1: [225, 29, 72], a1: 0.22, r2: [168, 85, 247], a2: 0.16, g1: [20, 4, 38], g2: [16, 3, 30], g3: [4, 1, 10], s1: 34, s2: 25, mp: 42 },
  /* 20 */ { r1: [147, 51, 234], a1: 0.22, r2: [79, 70, 229], a2: 0.14, g1: [16, 6, 34], g2: [12, 5, 26], g3: [3, 1, 8], s1: 34, s2: 25, mp: 42 },
  /* 21 */ { r1: [79, 70, 229], a1: 0.22, r2: [34, 211, 238], a2: 0.1, g1: [12, 8, 30], g2: [8, 6, 22], g3: [2, 1, 6], s1: 33, s2: 25, mp: 42 },
  /* 22 */ { r1: [59, 130, 246], a1: 0.2, r2: [34, 211, 238], a2: 0.08, g1: [8, 8, 26], g2: [6, 6, 18], g3: [1, 1, 4], s1: 32, s2: 24, mp: 42 },
  /* 23 */ { r1: [37, 99, 235], a1: 0.22, r2: [34, 211, 238], a2: 0.06, g1: [6, 8, 24], g2: [4, 6, 16], g3: [1, 1, 4], s1: 32, s2: 24, mp: 42 },
];

function _lerpKF(k1, k2, t) {
  return {
    r1: _lerpRGB(k1.r1, k2.r1, t),
    a1: _r2(_lerp(k1.a1, k2.a1, t)),
    r2: _lerpRGB(k1.r2, k2.r2, t),
    a2: _r2(_lerp(k1.a2, k2.a2, t)),
    g1: _lerpRGB(k1.g1, k2.g1, t),
    g2: _lerpRGB(k1.g2, k2.g2, t),
    g3: _lerpRGB(k1.g3, k2.g3, t),
    s1: Math.round(_lerp(k1.s1, k2.s1, t)),
    s2: Math.round(_lerp(k1.s2, k2.s2, t)),
    mp: Math.round(_lerp(k1.mp, k2.mp, t)),
  };
}

function _kfToStyle(kf) {
  return {
    backgroundImage: `radial-gradient(circle at top, rgba(${kf.r1.join(',')}, ${kf.a1}), transparent ${kf.s1}%), radial-gradient(circle at 20% 20%, rgba(${kf.r2.join(',')}, ${kf.a2}), transparent ${kf.s2}%), linear-gradient(180deg, ${_hex(kf.g1)} 0%, ${_hex(kf.g2)} ${kf.mp}%, ${_hex(kf.g3)} 100%)`
  };
}

const _bg = [];
for (let m = 0; m < 1440; m++) {
  const hour = m / 60;
  const hi = Math.floor(hour);
  const t = hour - hi;
  const ni = (hi + 1) % 24;
  const kf = t === 0 ? _K[hi] : _lerpKF(_K[hi], _K[ni], t);
  _bg.push({ time: _ts(m), style: _kfToStyle(kf) });
}

const backgroundColorAutoStyle = _bg;
const bgCyan400_10 = _fill('bg-cyan-900/20');
const neoGlassWetBase = _fill('backdrop-blur-sm md:backdrop-blur-md bg-white/5 backdrop-brightness-75 backdrop-contrast-125 border border-white/10 shadow-2xl');

describe('Neo-Noir 1440 Minute Resolution System', () => {
  it('correctly resolves a specific minute string (12:35)', () => {
    // Generate rules using _fill which maps to string 'HH:MM'
    // _fill generates 1440 entries from "0:00" to "23:59"
    // At minute 755 (12 * 60 + 35), time will be "12:35"
    
    // We want to test that when the engine evaluates auto(rules, now),
    // it selects the rule whose time exactly matches the minute string parsed.
    
    // The engine's totalMinutes goes from 0 to 1439.
    // The rules' time string like "12:35" is parsed into 755 minutes.
    
    const now = new Date();
    now.setHours(12, 35, 0, 0); // Total minutes from midnight = 755
    
    // Test the interpolated background styles (which use objects)
    const bgResult = auto(backgroundColorAutoStyle, {}, now);
    assert.strictEqual(typeof bgResult, 'object');
    assert.ok(bgResult.backgroundImage.includes('radial-gradient'));
    
    // Let's assert against the specific rule we expect
    const expectedRule = backgroundColorAutoStyle.find(r => r.time === "12:35");
    assert.deepStrictEqual(bgResult, expectedRule.style);
    
    // Test Tailwind class array string output
    const cyanResult = auto(bgCyan400_10, '', now);
    assert.strictEqual(cyanResult, 'bg-cyan-900/20');
  });

  it('correctly wraps around logic for strings like "0:00"', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = auto(neoGlassWetBase, '', now);
    assert.strictEqual(result, 'backdrop-blur-sm md:backdrop-blur-md bg-white/5 backdrop-brightness-75 backdrop-contrast-125 border border-white/10 shadow-2xl');
  });
});
