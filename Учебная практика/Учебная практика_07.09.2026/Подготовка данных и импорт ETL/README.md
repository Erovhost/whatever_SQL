# Подготовка данных и импорт (ETL)

Учебная практика 07.09.2026, подэтап 3.

**Задание:** очистить исходные файлы от аномалий (дубликаты, лишние пробелы, разные форматы дат, битые внешние ключи), импортировать данные в СУБД и проверить импорт запросами `SELECT count(*)`.

## Файлы

| Файл | Что в нём |
| --- | --- |
| [import_partners.csv](<import_partners.csv>) | Исходный список партнёров от заказчика |
| [import_sales.txt](<import_sales.txt>) | Исходная история продаж |
| [partner_types.tsv](<partner_types.tsv>) | Очищенные типы партнёров |
| [partners.tsv](<partners.tsv>) | Очищенные партнёры |
| [products.tsv](<products.tsv>) | Справочник продукции |
| [deliveries.tsv](<deliveries.tsv>) | Очищенные продажи |
| [rejected_sales.tsv](<rejected_sales.tsv>) | Отброшенная строка с несуществующим ID партнёра |
| [02_import_data.sql](<02_import_data.sql>) | Импорт очищенных данных; в комментариях описано, что исправлено |
| [checks.sql](<checks.sql>) | Проверка импорта: количество строк в каждой таблице |

## Запуск

```
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_import_data.sql
mysql -u root -p < checks.sql
```
