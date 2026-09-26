/**
 * Расчёт индивидуального процента скидки партнёра.
 * Скидка зависит от суммарного объёма продукции, купленной партнёром
 * за весь период сотрудничества.
 */
 
export const MIN_QUANTITY_FOR_5 = 10000;
export const MIN_QUANTITY_FOR_10 = 50000;
export const MIN_QUANTITY_FOR_15 = 300000;
 
export const DISCOUNT_NONE = 0;
export const DISCOUNT_SMALL = 5;
export const DISCOUNT_MEDIUM = 10;
export const DISCOUNT_LARGE = 15;
 
export function calculatePartnerDiscount(totalQuantity) {
  if (!Number.isInteger(totalQuantity)) {
    throw new TypeError('totalQuantity must be an integer');
  }
  if (totalQuantity < 0) {
    throw new RangeError('totalQuantity must not be negative');
  }
  if (totalQuantity >= MIN_QUANTITY_FOR_15) {
    return DISCOUNT_LARGE;
  }
  if (totalQuantity >= MIN_QUANTITY_FOR_10) {
    return DISCOUNT_MEDIUM;
  }
  if (totalQuantity >= MIN_QUANTITY_FOR_5) {
    return DISCOUNT_SMALL;
  }
  return DISCOUNT_NONE;
}