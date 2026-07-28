import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auto } from '../src/core/engine.js';

/**
 * Integration tests — simulate real-world usage patterns with mixed rule sets.
 */
describe('integration: real-world scenarios', () => {
  describe('e-commerce storefront', () => {
    const rules = [
      // Black Friday 2027 — highest priority
      { date: '2027-11-26', style: 'bg-black text-yellow-400 font-bold' },

      // Christmas day — recurring
      { date: '12-25', style: 'bg-red-700 text-white' },

      // Holiday season range
      { since: '12-01', until: '12-31', style: 'bg-green-800 text-green-100' },

      // Summer sale
      { since: '06-01', until: '08-31', style: 'bg-yellow-50 text-amber-800' },

      // Standard time-of-day
      { time: 6,  style: 'bg-white text-black' },
      { time: 18, style: 'bg-slate-900 text-slate-100' },
    ];

    it('shows Black Friday theme on Nov 26, 2027', () => {
      const now = new Date(2027, 10, 26, 14, 0, 0);
      assert.strictEqual(auto(rules, 'bg-gray-100', now), 'bg-black text-yellow-400 font-bold');
    });

    it('shows Christmas theme on Dec 25 (any year)', () => {
      const now = new Date(2028, 11, 25, 10, 0, 0);
      assert.strictEqual(auto(rules, 'bg-gray-100', now), 'bg-red-700 text-white');
    });

    it('shows holiday season on Dec 15', () => {
      const now = new Date(2027, 11, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'bg-gray-100', now), 'bg-green-800 text-green-100');
    });

    it('shows summer sale in July', () => {
      const now = new Date(2027, 6, 20, 14, 0, 0);
      assert.strictEqual(auto(rules, 'bg-gray-100', now), 'bg-yellow-50 text-amber-800');
    });

    it('falls back to time-of-day in March at night', () => {
      const now = new Date(2027, 2, 15, 21, 0, 0);
      assert.strictEqual(auto(rules, 'bg-gray-100', now), 'bg-slate-900 text-slate-100');
    });
  });

  describe('portfolio site (simple day/night)', () => {
    const rules = [
      { time: 6,  style: 'bg-white text-gray-900' },
      { time: 20, style: 'bg-gray-950 text-gray-100' },
    ];

    it('shows light theme at 10 AM', () => {
      const now = new Date(2027, 6, 15, 10, 0, 0);
      assert.strictEqual(auto(rules, 'bg-white', now), 'bg-white text-gray-900');
    });

    it('shows dark theme at 22:00', () => {
      const now = new Date(2027, 6, 15, 22, 0, 0);
      assert.strictEqual(auto(rules, 'bg-white', now), 'bg-gray-950 text-gray-100');
    });

    it('wraps around to dark theme at 3 AM', () => {
      const now = new Date(2027, 6, 15, 3, 0, 0);
      assert.strictEqual(auto(rules, 'bg-white', now), 'bg-gray-950 text-gray-100');
    });
  });

  describe('inline style objects (standard CSS)', () => {
    const rules = [
      { since: '12-01', until: '02-28', style: { backgroundColor: '#e0f2fe', color: '#0369a1' } },
      { since: '06-01', until: '08-31', style: { backgroundColor: '#fef08a', color: '#a16207' } },
      { time: 6,  style: { backgroundColor: '#ffffff', color: '#000000' } },
      { time: 18, style: { backgroundColor: '#0f172a', color: '#e2e8f0' } },
    ];

    it('returns winter style object in January', () => {
      const now = new Date(2027, 0, 15, 12, 0, 0);
      assert.deepStrictEqual(auto(rules, {}, now), { backgroundColor: '#e0f2fe', color: '#0369a1' });
    });

    it('returns summer style object in July', () => {
      const now = new Date(2027, 6, 15, 12, 0, 0);
      assert.deepStrictEqual(auto(rules, {}, now), { backgroundColor: '#fef08a', color: '#a16207' });
    });

    it('returns evening style in April at 20:00', () => {
      const now = new Date(2027, 3, 15, 20, 0, 0);
      assert.deepStrictEqual(auto(rules, {}, now), { backgroundColor: '#0f172a', color: '#e2e8f0' });
    });
  });

  describe('edge cases', () => {
    it('handles a single rule', () => {
      const rules = [{ time: 0, style: 'always-on' }];
      const now = new Date(2027, 6, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'always-on');
    });

    it('handles empty style string', () => {
      const rules = [{ time: 0, style: '' }];
      const now = new Date(2027, 6, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), '');
    });

    it('handles midnight exactly (00:00)', () => {
      const rules = [
        { time: 0, style: 'midnight' },
        { time: 12, style: 'noon' },
      ];
      const now = new Date(2027, 6, 15, 0, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'midnight');
    });

    it('handles new year boundary (Dec 31 → Jan 1)', () => {
      const rules = [
        { date: '01-01', style: 'new-year' },
        { since: '12-01', until: '02-28', style: 'winter' },
      ];
      const now = new Date(2028, 0, 1, 0, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'new-year');
    });

    it('handles leap year Feb 29', () => {
      const rules = [
        { date: '02-29', style: 'leap-day' },
      ];
      const now = new Date(2028, 1, 29, 12, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'leap-day');
    });
  });
});
