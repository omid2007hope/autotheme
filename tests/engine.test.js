import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auto } from '../src/core/engine.js';

describe('auto()', () => {
  describe('fallback behavior', () => {
    it('returns empty string when no rules and no fallback', () => {
      assert.strictEqual(auto([]), '');
    });

    it('returns fallback when no rules match', () => {
      assert.strictEqual(auto([], 'bg-white'), 'bg-white');
    });

    it('returns fallback for null rules', () => {
      assert.strictEqual(auto(null, 'bg-white'), 'bg-white');
    });

    it('returns fallback for undefined rules', () => {
      assert.strictEqual(auto(undefined, 'bg-white'), 'bg-white');
    });

    it('supports object fallback', () => {
      const fb = { backgroundColor: '#fff' };
      assert.deepStrictEqual(auto([], fb), fb);
    });
  });

  describe('time-of-day rules', () => {
    const rules = [
      { time: 0,  style: 'midnight' },
      { time: 6,  style: 'morning' },
      { time: 12, style: 'afternoon' },
      { time: 18, style: 'evening' },
    ];

    it('matches morning at 8 AM', () => {
      const now = new Date(2027, 6, 15, 8, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'morning');
    });

    it('matches afternoon at 14:00', () => {
      const now = new Date(2027, 6, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'afternoon');
    });

    it('matches evening at 21:00', () => {
      const now = new Date(2027, 6, 15, 21, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'evening');
    });

    it('matches midnight at 00:00', () => {
      const now = new Date(2027, 6, 15, 0, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'midnight');
    });

    it('matches at exact boundary hour', () => {
      const now = new Date(2027, 6, 15, 18, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'evening');
    });
  });

  describe('exact date rules', () => {
    it('matches recurring date (MM-DD)', () => {
      const rules = [
        { date: '10-31', style: 'halloween' },
        { time: 12, style: 'afternoon' },
      ];
      const now = new Date(2027, 9, 31, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'halloween');
    });

    it('exact date overrides time-of-day', () => {
      const rules = [
        { time: 18, style: 'evening' },
        { date: '12-25', style: 'christmas' },
      ];
      const now = new Date(2027, 11, 25, 20, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'christmas');
    });

    it('one-off date (YYYY-MM-DD) takes highest priority', () => {
      const rules = [
        { date: '10-31', style: 'generic-halloween' },
        { date: '2027-10-31', style: 'halloween-2027' },
      ];
      const now = new Date(2027, 9, 31, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'halloween-2027');
    });

    it('one-off date does not match in a different year', () => {
      const rules = [
        { date: '2027-11-26', style: 'black-friday-2027' },
        { time: 12, style: 'afternoon' },
      ];
      const now = new Date(2028, 10, 26, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'afternoon');
    });
  });

  describe('date range rules', () => {
    it('matches within a summer range', () => {
      const rules = [
        { since: '06-01', until: '08-31', style: 'summer' },
        { time: 12, style: 'afternoon' },
      ];
      const now = new Date(2027, 6, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'summer');
    });

    it('matches within a winter range (year-wrapping)', () => {
      const rules = [
        { since: '12-01', until: '02-28', style: 'winter' },
        { time: 12, style: 'afternoon' },
      ];
      const now = new Date(2027, 0, 15, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'winter');
    });

    it('date range takes priority over time-of-day', () => {
      const rules = [
        { time: 18, style: 'evening' },
        { since: '06-01', until: '08-31', style: 'summer' },
      ];
      const now = new Date(2027, 6, 15, 20, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'summer');
    });

    it('exact date takes priority over date range', () => {
      const rules = [
        { since: '10-01', until: '10-31', style: 'october' },
        { date: '10-31', style: 'halloween' },
      ];
      const now = new Date(2027, 9, 31, 14, 0, 0);
      assert.strictEqual(auto(rules, 'fallback', now), 'halloween');
    });
  });

  describe('priority ordering', () => {
    const allRules = [
      { time: 6, style: 'morning' },
      { time: 18, style: 'evening' },
      { since: '12-01', until: '02-28', style: 'winter-range' },
      { date: '12-25', style: 'christmas-recurring' },
      { date: '2027-12-25', style: 'christmas-2027' },
    ];

    it('one-off date wins over everything on matching day+year', () => {
      const now = new Date(2027, 11, 25, 20, 0, 0);
      assert.strictEqual(auto(allRules, 'fallback', now), 'christmas-2027');
    });

    it('recurring date wins over range and time on matching day (different year)', () => {
      const now = new Date(2028, 11, 25, 20, 0, 0);
      assert.strictEqual(auto(allRules, 'fallback', now), 'christmas-recurring');
    });

    it('range wins over time when in range but no date match', () => {
      const now = new Date(2027, 11, 15, 20, 0, 0);
      assert.strictEqual(auto(allRules, 'fallback', now), 'winter-range');
    });

    it('time wins when nothing else matches', () => {
      const now = new Date(2027, 4, 15, 20, 0, 0);
      assert.strictEqual(auto(allRules, 'fallback', now), 'evening');
    });
  });

  describe('style object support', () => {
    it('returns style objects for time rules', () => {
      const rules = [
        { time: 6, style: { backgroundColor: '#fff' } },
        { time: 18, style: { backgroundColor: '#111' } },
      ];
      const now = new Date(2027, 6, 15, 20, 0, 0);
      assert.deepStrictEqual(auto(rules, {}, now), { backgroundColor: '#111' });
    });

    it('returns style objects for date rules', () => {
      const rules = [
        { date: '10-31', style: { backgroundColor: 'orange', color: 'black' } },
      ];
      const now = new Date(2027, 9, 31, 14, 0, 0);
      assert.deepStrictEqual(auto(rules, {}, now), { backgroundColor: 'orange', color: 'black' });
    });
  });
});
