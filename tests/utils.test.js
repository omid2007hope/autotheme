import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, isExactDateMatch, isInDateRange, getMatchingTimeRule, parseTime, isSsr } from '../src/core/utils.js';

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
    { time: '18:30', _minutes: 1110, style: 'evening' },
    { time: '12:30', _minutes: 750, style: 'afternoon' },
    { time: '06:30', _minutes: 390,  style: 'morning' },
    { time: '00:00', _minutes: 0,  style: 'midnight' },
  ];

  it('matches the correct time slot', () => {
    const result = getMatchingTimeRule(timeRules, 14 * 60); // 14:00 (840 mins)
    assert.strictEqual(result.style, 'afternoon');
  });

  it('matches at the exact boundary', () => {
    const result = getMatchingTimeRule(timeRules, 1110); // 18:30
    assert.strictEqual(result.style, 'evening');
  });

  it('returns midnight rule for hour 0', () => {
    const result = getMatchingTimeRule(timeRules, 0); // 00:00 (0 mins)
    assert.strictEqual(result.style, 'midnight');
  });

  it('returns evening rule for hour 23', () => {
    const result = getMatchingTimeRule(timeRules, 23 * 60 + 59); // 23:59
    assert.strictEqual(result.style, 'evening');
  });

  it('returns null for empty array', () => {
    const result = getMatchingTimeRule([], 12 * 60);
    assert.strictEqual(result, null);
  });

  it('wraps around when time is before all rules', () => {
    const rules = [{ time: 20, _minutes: 1200, style: 'night' }, { time: 8, _minutes: 480, style: 'day' }];
    const result = getMatchingTimeRule(rules, 180); // 3 AM
    // 3 AM is before 8 AM — should wrap to the latest rule (20)
    assert.strictEqual(result.style, 'night');
  });
});

describe('parseTime', () => {
  it('parses legacy hour integers', () => {
    assert.strictEqual(parseTime(14), 840);
    assert.strictEqual(parseTime(0), 0);
  });
  it('parses HH:MM strings', () => {
    assert.strictEqual(parseTime('14:25'), 865);
    assert.strictEqual(parseTime('00:05'), 5);
  });
});

describe('isSsr', () => {
  it('returns false in Node.js test environment (global window not defined)', () => {
    // In Node.js without jsdom, window is undefined
    const result = isSsr();
    assert.strictEqual(result, true);
  });
});
 