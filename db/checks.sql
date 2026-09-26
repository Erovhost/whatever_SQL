-- ============================================================
-- checks.sql — проверка данных после импорта
-- ============================================================
-- Только чтение, данные не меняет.
-- Запуск после 02_import_data.sql: mysql -u root -p < db/checks.sql

USE partners_db;

-- 1. Количество строк в каждой таблице
SELECT 'partner_types' t, COUNT(*) n FROM partner_types UNION ALL
SELECT 'partners', COUNT(*) FROM partners UNION ALL
SELECT 'product_types', COUNT(*) FROM product_types UNION ALL
SELECT 'products', COUNT(*) FROM products UNION ALL
SELECT 'deliveries', COUNT(*) FROM deliveries UNION ALL
SELECT 'delivery_items', COUNT(*) FROM delivery_items;

-- 2. Партнёры и их объём
SELECT p.partner_id, pt.name AS type, p.name, p.phone, p.rating, SUM(di.quantity) AS qty
FROM partners p
JOIN partner_types pt ON pt.partner_type_id = p.partner_type_id
LEFT JOIN deliveries d ON d.partner_id = p.partner_id
LEFT JOIN delivery_items di ON di.delivery_id = d.delivery_id
GROUP BY p.partner_id, pt.name;

-- 3. Строки-сироты (все счётчики должны быть 0)
SELECT
  (SELECT COUNT(*) FROM delivery_items di LEFT JOIN deliveries d ON d.delivery_id = di.delivery_id WHERE d.delivery_id IS NULL) AS items_without_delivery,
  (SELECT COUNT(*) FROM delivery_items di LEFT JOIN products pr ON pr.product_id = di.product_id WHERE pr.product_id IS NULL) AS items_without_product,
  (SELECT COUNT(*) FROM deliveries d LEFT JOIN partners p ON p.partner_id = d.partner_id WHERE p.partner_id IS NULL) AS deliveries_without_partner,
  (SELECT COUNT(*) FROM deliveries d LEFT JOIN delivery_items di ON di.delivery_id = d.delivery_id WHERE di.item_id IS NULL) AS empty_deliveries;
