# UsBudget — карта проєкту (щоб не перечитувати код)

Версія на момент запису: v6.19.0 (точна — у `<title>` index.html і `CACHE` у sw.js). Номери рядків `public/index.html` змінюються — перед правкою шукати `grep -n "назва"` і читати `sed -n 'A,Bp'`.
Правила роботи й підрахунки — у `CLAUDE.md`; дизайн — `DESIGN.md`; для кого — `PRODUCT.md`.

## 1. Що це
PWA «бюджет для двох» (пара). Один файл `public/index.html` (~5900 рядків, Chart.js і Firebase з CDN; стилі Tailwind зібрані заздалегідь у `public/tw.css`), англійська поверх нього — `public/i18n.js`, офлайн — `public/sw.js`. Дані — Firebase Realtime DB, функції — Vercel (`api/`, `lib/`). Сайт: usbudget-groshi.vercel.app. Репозиторій: ilja117/vercelbudget.

## 2. Файли
| Файл | Для чого |
|---|---|
| `public/index.html` | весь застосунок (HTML + CSS + 8 inline-скриптів + головний скрипт) |
| `public/i18n.js` | переклад en: словник `D`, шаблони `P` (регулярки, замінник може бути функцією), масиви місяців `MONTHS/M_NOM/M_LOC/M_GEN/M_SHORT` |
| `public/tw.css`, `tailwind.config.cjs`, `tailwind.in.css` | готові стилі Tailwind (з v6.15.1 замість CDN): `npm run css` після нових класів у index.html; `tests/css.test.mjs` перевіряє, що файл свіжий |
| `public/sw.js` | кеш `CACHE='usbudget-vX.Y.Z'`; сторінка — спершу мережа; Firebase/API завжди з мережі; share-target для виписок |
| `public/manifest.webmanifest`, `public/icons/` | PWA |
| `api/inbox.js` | прийом платежів з телефона (`POST ?k=ключ`, `&dry=1` — лише розбір) |
| `api/reminders.js` | cron 06:00 UTC: push-нагадування + нічна копія (`makeBackup`) |
| `api/backup.js` | копії на сервері (лише учасники): GET список / GET `?id=b…` / POST `{reason}` |
| `api/push-test.js` | тестовий push |
| `api/rates.js` | курси (НБУ, CoinGecko, Yahoo) для конвертера |
| `lib/firebase-server.mjs` | `adminToken` (сервісний акаунт → OAuth), `dbUrl(path)`, `verifyMember(request)` (ID-токен + `members/`) |
| `lib/inbox.mjs` | розбір сповіщень банків: `normalize`, `merchantFrom`, `isDuplicate`, `whoByKey`, `itemId` |
| `lib/backup.mjs` | `makeBackup`, `toPrune`, `countRecords`; 30 днів / макс. 60 |
| `lib/schedule.mjs` | регулярні платежі `fxOccurrences`, `messageFor` (текст ранкового push) |
| `lib/rates.mjs` | `parseNbu/parseGecko/parseYahoo`, `convert`, `loadRates` |
| `tests/*.test.mjs` | `npm test` (30 тестів: balance, inbox, backup, rates, server, css) |
| `database.rules.json` | правила Firebase: усе закрито; `shared_budget_data`, `inbox` і `push_subs` — лише `members` |
| `vercel.json` | cron, заголовки sw/manifest, `outputDirectory: public` |
| `tools/preview/` | перегляд без CDN і живої бази (`build.sh`, `fakefb.js`, `shot.cjs`) |

## 3. Дані (Firebase `shared_budget_data`)
Масиви-колекції (`COLL`): `incomes, expenses, fixedExpenses, goals, personalIncomes, personalExpenses, settlements, contributions`.
По власниках (`OWNER_COLL`): `personalGoals, personalFixed`. Об'єкти (`BLOB_OWNER`): `personalCategories, personalCategoryLimits, personalModes`. Окремо: `settings` (там `inboxKeys{p1,p2}`, `modelStart`, `personalRange`, `importRules`, `showPersonalRec`, імена/кольори партнерів), `inbox/<id>` — з v6.15 у корені бази, поза `shared_budget_data` (платежі з телефона), `backups/<id>` + `backup_meta/<id>` (копії), `push_subs`, `members/<uid>=true`.
Клієнт: `state` (≈1223), `fromRemote` ↔ `toTree`, зміни — `flattenState` + `diffFlat` → `saveToCloud` (≈1877). Ключі Firebase кодуються `encKey/decKey`. Локальний кеш `usbudget_state`.
Записи мають `id`, `date`, `amount`; витрата: `title, category, payer, split, scope` (`shared|p1|p2`), `bank` (захист від дублів імпорту: `inbox:<id>` або id із виписки).

## 4. Скрипти в index.html (порядок = шари)
| Скрипт / місце | Що там |
|---|---|
| головний `<script>` (≈1220–4470) | стан, синк, вхід, копії, модалки, усі вкладки, `renderAll` (≈2628), `switchTab` (≈2074), особисті вкладки, приватність/PIN, регулярні, експорт, `renderGraphicHero` (≈4303), аналітика |
| `#usbudget-theme-engine-js` (≈474) | теми: `SKINS`, `mascotSvg`, `setThemePref`, `THEMES`, `PLAIN`, `current()`, `apply()`; сховище `usbudget_theme` (`off`/`auto`/місяць/`sk-<id>`) |
| `#usbudget-nav-v5` (≈4842) | навігація (v6.16: Головна · Записи · «+» · Моє · Ще; `NAV_GROUPS`: `me` = p1/p2, «Моє» відкриває вкладку власника телефона `usbudget_push_owner`; `more` = Борги, Регулярні, Цілі, Аналітика, Налаштування), `renderAllV5`, `switchTabV5`, інсайти |
| `#usbudget-import` (≈4964) | імпорт виписок (CSV/XLSX), `impClassify`, правила |
| `#usbudget-fold` (≈5264) | автозгортання карток; нову картку з полями позначати `data-fold="0"` |
| `#usbudget-simple` (≈5326) | «+» → «Що сталося?», «Звідки це число?», розкладка головної, `openIntro` |
| `#usbudget-inbox` (≈5536) | «Нові з картки»: `render`, `accept`, `skip`, власник телефона `me()`; «Інший телефон» |
| `#usbudget-msum` (≈5756) | картка «Підсумок місяця» (1–5 числа) |
| `#usbudget-convert` (≈5800) | конвертер валют/крипти/акцій |
| `#usbudget-tidy` | v6.19: «Видалити запис» у вікні редагування з підтвердженням (`DEL` за видом запису; з рядків списків кнопку прибрано); вибір місяця прихований у налаштуваннях; довгі списки (історія витрат, мої витрати/доходи) — 5 записів + «Показати всі (N)» (`clipLists`, `CLIP_IDS`, обгортки `renderAll`/`renderPersonalTabs`) |
| `#usbudget-settings-order` (останній) | v6.18: групи налаштувань (Пара і бюджет · Телефон і сповіщення · Вигляд · Безпека і копії); картки за id `set-*`, `app-card`, `ib-setup`, `g-lang`, `g-account-card`; обгортка `switchTab` + DOMContentLoaded |
Стилі: `#usbudget-graphic` (токени `--g-*`), `#usbudget-skins` (рожеві теми), `#usbudget-clay` (форма «Глина»).

## 5. Ключі localStorage
`usbudget_state` (кеш даних), `usbudget_backups` (копії на пристрої), `usbudget_theme`, `usbudget_push_owner` (чий це телефон: p1/p2), `usbudget_push_key`, `usbudget_local_remind`, `usbudget_msum` (місяць, де «Зрозуміло»), `usbudget_rates`, `usbudget_motion`, `usbudget_intro`, `usbudget_lang`, `usbudget_qa_cat/qa_who`, `usbudget_home_more`, `usbudget_banner_dismissed`, `usbudget_base`.

## 6. Змінні Vercel (лише там, не в репозиторії)
`FIREBASE_SERVICE_ACCOUNT` (JSON), `FIREBASE_DB_URL`, `FIREBASE_API_KEY`, `REQUIRE_AUTH`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT`, `CRON_SECRET`. Публічний VAPID у `index.html` (`VAPID_PUBLIC`) — пара з приватним. Змінні діють після Redeploy.

## 7. Потоки
- **Вхід:** `AUTH_REQUIRED=true`, Firebase Auth e-mail/пароль → `members/<uid>`.
- **Платіж з телефона:** MacroDroid/Shortcuts → `api/inbox` → `normalize` (суму, магазин; зарахування → `kind:'in'`; промокоди, коди, баланс — ігнор) → `inbox/<id>` з `who` за ключем → картка «Нові з картки» власника → «Додати» (витрата) / «Додати як дохід» / «Пропустити».
- **Нічний cron:** `api/reminders` → push (`messageFor`) + `makeBackup`.
- **Копія/відновлення:** локальні (`pushBackup`, `restoreBackup`, `protectLocked`) і серверні (`srvBk*`); відновлення зберігає PIN-секції й `inboxKeys`.
- **Реліз:** підняти версію в `<title>` index.html і `CACHE` у sw.js, додати переклади в i18n, нові класи Tailwind → `npm run css`, `npm test`, прогін у перегляді (uk і en), коміт у робочу гілку, питання «так/ні», злиття в `main` → Vercel деплоїть сам.

## 8. Перевірка
`cd tools/preview && ./build.sh`, сервер `cd out && python3 -m http.server 8766` (інколи падає — перезапустити), Playwright-скрипти: `serviceWorkers:'block'`, `usbudget_intro=1`, `page.clock.install` для дати; перевіряти `pageerror`. Тести сервера: `npm test`.

## 9. Пастки
- `\b` у JS-регулярках не бачить кирилиці.
- Анімація `g-rise` перебиває `-translate-x-1/2`: центрувати через `left:0;right:0;margin:auto`.
- i18n накладається асинхронно; текст із ` · ` перекладається частинами.
- Приховані блоки: у тестах `textContent`, не `innerText`.
- Не переписувати ключі Firebase/VAPID з пам'яті — лише копіювати.
- Картку не прибирати, якщо в ній єдина кнопка повернення (помилка v6.14.0 з «Інший телефон»).

## 10. Функції за версіями (перенесено з CLAUDE.md)
- Конвертер (v6.7): кнопка в шапці → `openConverter()`, скрипт `#usbudget-convert`; ціни з `api/rates.js` + `lib/rates.mjs` (НБУ, CoinGecko, Yahoo; все через долар), останні курси в `usbudget_rates`. Тест: `tests/rates.test.mjs`.
- «Нові з картки» (v6.8): телефон шле платіж на `api/inbox.js` (`lib/inbox.mjs`, ключ із `settings.inboxKeys[p1|p2]`) → `inbox/<id>` (з v6.15 окрема гілка бази; старе `shared_budget_data/inbox` застосунок переносить сам); скрипт `#usbudget-inbox` показує їх на головній над «Останні записи», «Додати» створює запис із `bank: 'inbox:<id>'` (імпорт виписок такі вимикає як дублі). Налаштування — картка `#ib-setup` у «Налаштуваннях» (кнопка «Перевірити», інструкції iPhone і Android/MacroDroid, перевірка тексту через `&dry=1`). Android шле сирий `title`/`text` у параметрах посилання; розбір — `normalize`/`merchantFrom` (сума поруч із валютою, баланс і картка відкидаються, коди й промокоди пропускаються, дубль за 2 хв). Надходження (v6.10): `kind: 'in'` → рядок «Надходження», «Додати як дохід» → `personalIncomes` з `bank: 'inbox:<id>'`. Тест: `tests/inbox.test.mjs`.
- «Чиє» в «Нові з картки» (v6.19.1): новий магазин — «Особисте»; «Додати» записує правило в `settings.importRules` (`{k: impKey(магазин), cat, for: 'shared'|p1|p2, pay: 'card'|p1|p2}`, спільне з імпортом), і наступного разу `guess` ставить той самий вибір.
- Копії на сервері (v6.11): `lib/backup.mjs` `makeBackup` → `backups/<id>` (дерево `shared_budget_data` без `inbox`) + `backup_meta/<id>` {ts,count,reason}; 30 днів / макс. 60. Щоночі з `api/reminders.js`; `api/backup.js` (лише учасники: GET список, GET ?id, POST копія). У застосунку — блок «На сервері» в картці «Автокопії» (`renderServerBackups`, `srvBkRestore` → `fromRemote` + `protectLocked`, що зберігає `inboxKeys`). Тест: `tests/backup.test.mjs`. Ранкове сповіщення (v6.12): `messageFor` у `lib/schedule.mjs` додає рядок про `inbox` цієї людини, що чекає з учора (тест там же).
- «Підсумок місяця» (v6.13): скрипт `#usbudget-msum`, картка `#g-msum` на головній 1–5 числа (минулий місяць через `monthlySummary`), «Зрозуміло» → `localStorage usbudget_msum`. «Нові з картки» (v6.14.1) показують лише платежі власника телефона (`usbudget_push_owner`, той самий вибір, що для нагадувань), чужі — за кнопкою «Інший телефон».
- Нова навігація (v6.16): нижнє меню Головна · Записи · «+» · Моє · Ще; Борги — у «Ще» (на головній лишилась плашка боргу). «Витрати»: спершу «Історія витрат» з кнопкою «Виписка» (імпорт), далі ліміти; форма «Додати витрату» прихована (`data-dup-form`, поля лишаються для `addExpense`), додавання — через «+».
- Вкладка «Моє» (v6.17): порядок — шапка (ім'я, «Заблокувати» якщо є PIN, «Налаштувати»), «Вільний залишок», Мої витрати, Мої доходи, Цілі, Регулярні, форми додавання, структура (лише коли є витрати, `pp-<k>-struct`). Службове — у `pp-<k>-setup` (`data-fold="0"`): «Свій період» (`pp-<k>-range`), PIN (`pp-<k>-pin`), категорії й ліміти (`pp-<k>-cats-card`); відкривається кнопкою (`togglePersonalSetup`, стан `ppSetupOpen`, `applyPersonalSetup`). Увімкнений «Свій період» видно завжди.
- Налаштування (v6.18): групи з заголовками, стара шапка `set-couple` прихована; «Налаштування» прибрано з кнопок «Ще» (шестерня в шапці тепер і на комп'ютері); кнопку «Аналітика» з налаштувань прибрано (є в «Ще»); «Резервне копіювання» → «Копія у файл», стоїть поруч з «Автокопії».
- Дрібниці (v6.19): дати в списках — `dayLabel(iso)` («20 лис», інший рік — «05.03.2025»); головна без внеску — «Внеску ще немає» і кнопка «Записати внесок» (`openSimple('put')`, тепер `window.openSimple`).
