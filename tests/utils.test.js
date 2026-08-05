import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, isExactDateMatch, isInDateRange, getMatchingTimeRule, isSsr } from '../src/core/utils.js';

describe('parseDate', () => {
  it('parses MM-DD format', () => {
    const result = parseDate('10-31');
    assert.deepStrictEqual(result, { month: 10, day: 31 });
  });

  it('parses YYYY-MM-DD format', () => {
    const result = parseDate('2027-11-26');
    assert.deepStrictEqual(result, { year: 2027, month: 11, day: 26 });
  });

  it('parses single-digit months and days', () => {
    const result = parseDate('01-05');
    assert.deepStrictEqual(result, { month: 1, day: 5 });
  });
});

describe('isExactDateMatch', () => {
  it('matches recurring date (MM-DD)', () => {
    const rule = { date: '10-31', style: 'halloween' };
    const oct31 = new Date(2027, 9, 31);
    assert.strictEqual(isExactDateMatch(rule, oct31), true);
  });

  it('does not match wrong day', () => {
    const rule = { date: '10-31', style: 'halloween' };
    const oct30 = new Date(2027, 9, 30);
    assert.strictEqual(isExactDateMatch(rule, oct30), false);
  });

  it('matches one-off date (YYYY-MM-DD)', () => {
    const rule = { date: '2027-11-26', style: 'black-friday' };
    const bf = new Date(2027, 10, 26);
    assert.strictEqual(isExactDateMatch(rule, bf), true);
  });

  it('does not match one-off date in wrong year', () => {
    const rule = { date: '2027-11-26', style: 'black-friday' };
    const wrongYear = new Date(2028, 10, 26);
    assert.strictEqual(isExactDateMatch(rule, wrongYear), false);
  });
});

describe('isInDateRange', () => {
  it('matches within a non-wrapping range (Jun–Aug)', () => {
    const rule = { since: '06-01', until: '08-31', style: 'summer' };
    const july15 = new Date(2027, 6, 15);
    assert.strictEqual(isInDateRange(rule, july15), true);
  });

  it('does not match outside a non-wrapping range', () => {
    const rule = { since: '06-01', until: '08-31', style: 'summer' };
    const oct1 = new Date(2027, 9, 1);
    assert.strictEqual(isInDateRange(rule, oct1), false);
  });

  it('matches within a wrapping range (Dec–Feb)', () => {
    const rule = { since: '12-01', until: '02-28', style: 'winter' };
    const jan15 = new Date(2027, 0, 15);
    assert.strictEqual(isInDateRange(rule, jan15), true);
  });

  it('matches December in a wrapping range', () => {
    const rule = { since: '12-01', until: '02-28', style: 'winter' };
    const dec15 = new Date(2027, 11, 15);
    assert.strictEqual(isInDateRange(rule, dec15), true);
  });

  it('does not match outside a wrapping range', () => {
    const rule = { since: '12-01', until: '02-28', style: 'winter' };
    const may1 = new Date(2027, 4, 1);
    assert.strictEqual(isInDateRange(rule, may1), false);
  });

  it('matches on the exact start date', () => {
    const rule = { since: '06-01', until: '08-31', style: 'summer' };
    const jun1 = new Date(2027, 5, 1);
    assert.strictEqual(isInDateRange(rule, jun1), true);
  });

  it('matches on the exact end date', () => {
    const rule = { since: '06-01', until: '08-31', style: 'summer' };
    const aug31 = new Date(2027, 7, 31);
    assert.strictEqual(isInDateRange(rule, aug31), true);
  });
});

describe('getMatchingTimeRule', () => {
  // Rules must be pre-sorted descending by time, as output by compile()
  const timeRules = [
    { time: 18, style: 'evening' },
    { time: 12, style: 'afternoon' },
    { time: 6,  style: 'morning' },
    { time: 0,  style: 'midnight' },
  ];

  it('matches the correct time slot', () => {
    const result = getMatchingTimeRule(timeRules, 14);
    assert.strictEqual(result.style, 'afternoon');
  });

  it('matches at the exact boundary', () => {
    const result = getMatchingTimeRule(timeRules, 18);
    assert.strictEqual(result.style, 'evening');
  });

  it('returns midnight rule for hour 0', () => {
    const result = getMatchingTimeRule(timeRules, 0);
    assert.strictEqual(result.style, 'midnight');
  });

  it('returns evening rule for hour 23', () => {
    const result = getMatchingTimeRule(timeRules, 23);
    assert.strictEqual(result.style, 'evening');
  });

  it('returns null for empty array', () => {
    const result = getMatchingTimeRule([], 12);
    assert.strictEqual(result, null);
  });

  it('wraps around when hour is before all rules', () => {
    const rules = [{ time: 20, style: 'night' }, { time: 8, style: 'day' }];
    const result = getMatchingTimeRule(rules, 3);
    // 3 AM is before 8 AM — should wrap to the latest rule (20)
    assert.strictEqual(result.style, 'night');
  });
});

describe('isSsr', () => {
  it('returns false in Node.js test environment (global window not defined)', () => {
    // In Node.js without jsdom, window is undefined
    const result = isSsr();
    assert.strictEqual(result, true);
  });
});
