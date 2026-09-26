import { calculatePartnerDiscount } from './discount.js';
 
const quantities = [9999, 10000, 49999, 50000, 299999, 300000];
 
for (const quantity of quantities) {
  const discount = calculatePartnerDiscount(quantity);
  console.log(`Объём: ${quantity} ед. -> скидка: ${discount}%`);
}
 