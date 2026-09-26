# Написание DDL-скрипта

Учебная практика 07.09.2026, подэтап 2.

**Задание:** SQL-скрипт развёртывания структуры: `DROP TABLE IF EXISTS` с учётом зависимостей, `CREATE TABLE` с типами данных и явными ограничениями (`PRIMARY KEY`, `FOREIGN KEY ... ON DELETE RESTRICT/CASCADE`).

## Файлы

| Файл | Что в нём |
| --- | --- |
| [db/01_schema.sql](<../../../db/01_schema.sql>) | Создание БД `partners_db`, удаление и создание всех таблиц |

## Запуск

```
mysql -u root -p < db/01_schema.sql
```
