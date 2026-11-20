---
name: backend
description: Робота з бекендом UsBudget — функції Vercel (api/, lib/), Firebase Realtime DB (дані, правила, слухачі, синхронізація), вхід, сповіщення VAPID, cron, копії, ключі. Використовувати для будь-якої зміни api/, lib/, database.rules.json, vercel.json або коду синхронізації й входу в index.html.
---

# Бекенд

Карта: `docs/ARCHITECTURE.md` §2 (файли), §3 (дані), §6 (змінні Vercel), §7 (потоки), §10 (функції).

## Функції Vercel (`api/*.js`)
- Формат: `export async function GET/POST(request)` → `Response`. Спільна логіка — у `lib/*.mjs` (чисті функції, щоб тестувати).
- Доступ до бази — `lib/firebase-server.mjs`: `adminToken`, `dbUrl(path)`; захист — `verifyMember(request)` при `REQUIRE_AUTH=1` (див. `api/push-test.js`).
- Нова логіка в `lib/` → тест у `tests/<назва>.test.mjs` (`node:test`), `npm test`.
- Ключі лише у Vercel Environment Variables; діють після Redeploy. У репозиторій не класти, з пам'яті не переписувати — лише копіювати з тексту користувача.
- Cron — у `vercel.json` (06:00 UTC, `api/reminders.js`, захист `CRON_SECRET`).

## База Firebase
- Безпеку без прямого прохання не змінювати: `AUTH_REQUIRED = true`, `database.rules.json` — лише `members`. Нова гілка бази → своє правило з `members` у `database.rules.json` і нагадати користувачу опублікувати правила (Firebase Console → Rules), бо вони не деплояться самі.
- Зміна будь-чого під `shared_budget_data` будить слухача всієї бази, і `fromRemote` затирає незбережений `state` → спершу `saveToCloud()`, потім інші записи.
- `db` існує до входу: слухачі й запити — лише після `onAuthStateChanged` з користувачем, інакше відмова і слухач гасне назавжди.
- Ключі кодуються `encKey/decKey`; зміни — `flattenState` + `diffFlat` → `saveToCloud`.
- Підрахунки (борг, «Можна ще витратити», картка) — формули в `CLAUDE.md`; тест `tests/balance.test.mjs`.

## Сповіщення
`VAPID_PUBLIC` в `index.html` і `VAPID_PRIVATE_KEY` на Vercel — пара. Змінили одне → міняти обидва, Redeploy, заново ввімкнути сповіщення на телефонах.

## Перевірка
`node --check` змінених файлів, `npm test`; синхронізація/слухачі — `node tools/preview/inbox-accept.cjs` (жива заглушка; `fakefb.js` цих пасток не ловить); інтерфейс — скіл `preview-check`. Перед злиттям — скіл `security-review` для змін доступу й скіл `release`.
