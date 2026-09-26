# Подготовка данных и импорт (ETL)

Учебная практика 07.09.2026, подэтап 3.

**Задание:** очистить исходные файлы от аномалий (дубликаты, лишние пробелы, разные форматы дат, битые внешние ключи), импортировать данные в СУБД и проверить импорт запросами `SELECT count(*)`.

## Файлы

| Файл | Что в нём |
| --- | --- |
| [db/data/raw/import_partners.csv](<../../../db/data/raw/import_partners.csv>) | Исходный список партнёров от заказчика |
| [db/data/raw/import_sales.txt](<../../../db/data/raw/import_sales.txt>) | Исходная история продаж |
| [db/data/clean/partner_types.tsv](<../../../db/data/clean/partner_types.tsv>) | Очищенные типы партнёров |
| [db/data/clean/partners.tsv](<../../../db/data/clean/partners.tsv>) | Очищенные партнёры |
| [db/data/clean/products.tsv](<../../../db/data/clean/products.tsv>) | Справочник продукции |
| [db/data/clean/deliveries.tsv](<../../../db/data/clean/deliveries.tsv>) | Очищенные продажи |
| [db/data/clean/rejected_sales.tsv](<../../../db/data/clean/rejected_sales.tsv>) | Отброшенная строка с несуществующим ID партнёра |
| [db/02_import_data.sql](<../../../db/02_import_data.sql>) | Импорт очищенных данных; в комментариях описано, что исправлено |
| [db/checks.sql](<../../../db/checks.sql>) | Проверка импорта: количество строк в каждой таблице |

## Запуск

```
mysql -u root -p < db/01_schema.sql
mysql -u root -p < db/02_import_data.sql
mysql -u root -p < db/checks.sql
```
