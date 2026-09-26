import express from 'express';
import mysql from 'mysql2/promise';
import { calculatePartnerDiscount } from './discount.js';
import { parsePartnerInput } from './partner.js';

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
    rating: row.rating === null ? null : Number(row.rating),
    totalQuantity: Number(row.total_quantity),
    discountPercent: calculatePartnerDiscount(Number(row.total_quantity)),
  }));
}

const SQL_PARTNER_TYPES = `
SELECT partner_type_id, name
FROM partner_types
ORDER BY name`;

const SQL_PARTNER_BY_ID = `
SELECT
    partner_id,
    partner_type_id,
    name,
    director_name,
    email,
    phone,
    inn,
    legal_address,
    rating
FROM partners
WHERE partner_id = ?`;

export async function getPartnerTypes() {
  const [rows] = await pool.query(SQL_PARTNER_TYPES);
  return rows.map((row) => ({
    partnerTypeId: row.partner_type_id,
    name: row.name,
  }));
}

export async function getPartnerById(partnerId) {
  const [rows] = await pool.execute(SQL_PARTNER_BY_ID, [partnerId]);
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    partnerId: row.partner_id,
    partnerTypeId: row.partner_type_id,
    name: row.name,
    directorName: row.director_name,
    email: row.email,
    phone: row.phone,
    inn: row.inn,
    legalAddress: row.legal_address,
    rating: row.rating === null ? null : Number(row.rating),
  };
}

const SQL_PARTNER_TYPE_EXISTS = `
SELECT 1
FROM partner_types
WHERE partner_type_id = ?`;

const SQL_INSERT_PARTNER = `
INSERT INTO partners
    (partner_type_id, name, director_name, email, phone, inn, legal_address, rating)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

const SQL_UPDATE_PARTNER = `
UPDATE partners
SET partner_type_id = ?,
    name = ?,
    director_name = ?,
    email = ?,
    phone = ?,
    inn = ?,
    legal_address = ?,
    rating = ?
WHERE partner_id = ?`;

function toPartnerParams(partner) {
  return [
    partner.partnerTypeId,
    partner.name,
    partner.directorName,
    partner.email,
    partner.phone,
    partner.inn,
    partner.legalAddress,
    partner.rating,
  ];
}

async function partnerTypeExists(partnerTypeId) {
  const [rows] = await pool.execute(SQL_PARTNER_TYPE_EXISTS, [partnerTypeId]);
  return rows.length > 0;
}

export async function createPartner(partner) {
  const [result] = await pool.execute(SQL_INSERT_PARTNER, toPartnerParams(partner));
  return result.insertId;
}

export async function updatePartner(partnerId, partner) {
  const params = toPartnerParams(partner);
  params.push(partnerId);
  const [result] = await pool.execute(SQL_UPDATE_PARTNER, params);
  return result.affectedRows > 0;
}

// Нарушения UNIQUE/FK из СУБД переводятся в понятный пользователю текст.
function describeConstraintError(error) {
  if (error.code === 'ER_DUP_ENTRY' && error.message.includes('uq_partners_email')) {
    return 'Партнёр с таким email уже есть в базе.';
  }
  if (error.code === 'ER_DUP_ENTRY' && error.message.includes('uq_partners_inn')) {
    return 'Партнёр с таким ИНН уже есть в базе.';
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return 'Выбранный тип партнёра не найден. Обновите страницу и выберите тип заново.';
  }
  return null;
}

function parsePartnerId(value) {
  const partnerId = Number(value);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return null;
  }
  return partnerId;
}

async function savePartner(req, res, partnerId) {
  const { partner, error } = parsePartnerInput(req.body ?? {});
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    if (!(await partnerTypeExists(partner.partnerTypeId))) {
      res.status(400).json({ error: 'Выбранный тип партнёра не найден. Обновите страницу и выберите тип заново.' });
      return;
    }
    if (partnerId === null) {
      const newPartnerId = await createPartner(partner);
      res.status(201).json({ partnerId: newPartnerId });
      return;
    }
    const isUpdated = await updatePartner(partnerId, partner);
    if (!isUpdated) {
      res.status(404).json({ error: 'Партнёр не найден, возможно, он был удалён.' });
      return;
    }
    res.json({ partnerId });
  } catch (dbError) {
    const message = describeConstraintError(dbError);
    if (message !== null) {
      res.status(409).json({ error: message });
      return;
    }
    console.error(dbError);
    res.status(500).json({ error: 'internal server error' });
  }
}

const app = express();

app.use(express.json());

app.post('/api/partners', (req, res) => savePartner(req, res, null));

app.put('/api/partners/:id', (req, res) => {
  const partnerId = parsePartnerId(req.params.id);
  if (partnerId === null) {
    res.status(400).json({ error: 'invalid partner id' });
    return;
  }
  return savePartner(req, res, partnerId);
});

app.get('/api/partner-types', async (req, res) => {
  try {
    const partnerTypes = await getPartnerTypes();
    res.json(partnerTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/partners/:id', async (req, res) => {
  const partnerId = parsePartnerId(req.params.id);
  if (partnerId === null) {
    res.status(400).json({ error: 'invalid partner id' });
    return;
  }
  try {
    const partner = await getPartnerById(partnerId);
    if (partner === null) {
      res.status(404).json({ error: 'partner not found' });
      return;
    }
    res.json(partner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'internal server error' });
  }
});

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