# Интеграция с БД и агрегация данных (SQL + Backend)

Учебная практика 14.09.2026, подэтап 2.

**Задание:** подключить БД к коду, получить суммарный объём продаж каждого партнёра запросом с `SUM(quantity)` и `LEFT JOIN` и объединить результат с функцией расчёта скидки.

## Файлы

| Файл | Что в нём |
| --- | --- |
| [src/server.js](<../../../src/server.js>) | Подключение к MySQL (`mysql2`), запрос `SQL_PARTNERS` с `SUM` и `LEFT JOIN`, функция `getPartnersWithDiscount()` — партнёр вместе с процентом скидки, API `GET /api/partners` |
| [src/discount.js](<../../../src/discount.js>) | Функция расчёта скидки, которую вызывает сервер |
| [package.json](<../../../package.json>) | Зависимости (`express`, `mysql2`) и команды запуска |

## Запуск

```
npm install
npm start           # http://localhost:3000/api/partners
```
