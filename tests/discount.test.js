import test from 'node:test';
import assert from 'node:assert/strict';
 
import { calculatePartnerDiscount } from '../src/discount.js';
 
const boundaryCases = [
  { quantity: 0, expected: 0 },
  { quantity: 1, expected: 0 },
  { quantity: 9999, expected: 0 },
  { quantity: 10000, expected: 5 },
  { quantity: 10001, expected: 5 },
  { quantity: 49999, expected: 5 },
  { quantity: 50000, expected: 10 },
  { quantity: 50001, expected: 10 },
  { quantity: 299999, expected: 10 },
  { quantity: 300000, expected: 15 },
  { quantity: 300001, expected: 15 },
  { quantity: 1000000, expected: 15 },
];
 
test('пограничные значения объёма дают верный процент скидки', () => {
  for (const testCase of boundaryCases) {
    const actual = calculatePartnerDiscount(testCase.quantity);
    assert.equal(actual, testCase.expected, `объём ${testCase.quantity}`);
  }
});
 
test('нецелое число объёма отклоняется', () => {
  assert.throws(() => calculatePartnerDiscount(10000.5), TypeError);
});
 
test('нечисловой аргумент отклоняется', () => {
  assert.throws(() => calculatePartnerDiscount('10000'), TypeError);
});
 
test('отсутствующий аргумент отклоняется', () => {
  assert.throws(() => calculatePartnerDiscount(), TypeError);
});
 
test('NaN отклоняется', () => {
  assert.throws(() => calculatePartnerDiscount(Number.NaN), TypeError);
});
 
test('отрицательный объём отклоняется', () => {
  assert.throws(() => calculatePartnerDiscount(-1), RangeError);
});