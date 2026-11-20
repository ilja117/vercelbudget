---
name: preview-check
description: Перевірка UsBudget у локальному перегляді (без CDN і живої бази) — знімки вкладок і тем, помилки сторінки, українська й англійська. Використовувати після будь-якої зміни public/ (index.html, i18n.js, sw.js, tw.css) перед тим, як здавати роботу.
---

# Перевірка в перегляді

1. Зібрати: `tools/preview/build.sh` (залежності ставить хук старту; якщо ні — `cd tools/preview && npm i`).
2. Сервер у фоні: `cd tools/preview/out && python3 -m http.server 8766` (`run_in_background`). Якщо впав — перезапустити.
3. Прогін без знімків уваги — головне `pageerror`:
   - `node tools/preview/shot.cjs dashboard expenses fixed goals p1 settlement settings`
   - те саме з `LANG=en`
   - змінено тему/стилі → ще `SKIN=sk-bunny|sk-cat|sk-candy|sk-hamster|sk-mochi`, `DARK=1`.
   Очікується `ok, no page errors`. Будь-яка помилка — не здавати.
4. Знімки (`tools/preview/out/shots/*.png`) дивитися вибірково — лише вкладку, яку змінювали (дорого).
5. Свої сценарії Playwright: контекст `serviceWorkers:'block'`, `localStorage usbudget_intro=1`, дата — `page.clock.install`, xlsx — через `page.route`. Текст читати після паузи (i18n асинхронний); прихований блок — `textContent`, не `innerText`.
6. Зміни в синхронізації/«Нові з картки»/слухачах бази → `node tools/preview/inbox-accept.cjs` (жива заглушка `livefb.js`, що будить слухачів як справжній Firebase). Слухачі після входу — перевіряти сценарієм із затримкою входу.
7. Великі чистки — порівняти `innerText` усіх вкладок до/після.
8. Числа звірити вручну з формулами з `CLAUDE.md` («Підрахунки»).
