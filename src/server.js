import express from 'express';
import mysql from 'mysql2/promise';
import { calculatePartnerDiscount } from './discount.js';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'crm',
  password: '12345',
  database: 'partners_db',
});

const SQL_PARTNERS = `
SELECT
    p.partner_id,
    p.name,
    p.director_name,
    p.email,
    p.phone,
    p.inn,
    p.rating,
    pt.name AS partner_type,
    CAST(COALESCE(SUM(di.quantity), 0) AS SIGNED) AS total_quantity
FROM partners AS p
LEFT JOIN partner_types  AS pt ON pt.partner_type_id = p.partner_type_id
LEFT JOIN deliveries     AS d  ON d.partner_id = p.partner_id
LEFT JOIN delivery_items AS di ON di.delivery_id = d.delivery_id
GROUP BY p.partner_id, pt.partner_type_id
ORDER BY total_quantity DESC`;

export async function getPartnersWithDiscount() {
  const [rows] = await pool.query(SQL_PARTNERS);
  return rows.map((row) => ({
    partnerId: row.partner_id,
    partnerType: row.partner_type,
    name: row.name,
    directorName: row.director_name,
    email: row.email,
    phone: row.phone,
    inn: row.inn,
    rating: Number(row.rating),
    totalQuantity: Number(row.total_quantity),
    discountPercent: calculatePartnerDiscount(Number(row.total_quantity)),
  }));
}

const app = express();

app.get('/api/partners', async (req, res) => {
  try {
    const partners = await getPartnersWithDiscount();
    res.json(partners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.use(express.static('public'));

app.listen(3000, () => console.log('http://localhost:3000'));