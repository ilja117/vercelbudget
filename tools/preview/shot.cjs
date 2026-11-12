// Скріншоти розділів: node tools/preview/shot.cjs [tab ...]  (сервер з build.sh має працювати)
// Прапорці: DARK=1, LANG=en, W=390. Результат: tools/preview/out/shots/*.png
const { chromium } = require('playwright'); // браузер і Playwright вже є в середовищі; не ставити локально
const { mkdirSync } = require('fs');
const tabs = process.argv.slice(2).length ? process.argv.slice(2) : ['dashboard', 'expenses', 'fixed', 'goals', 'p1', 'settlement', 'settings'];
const out = __dirname + '/out/shots/'; mkdirSync(out, { recursive: true });
(async () => {
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: Number(process.env.W || 390), height: 844 } }), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(([d, l]) => { localStorage.setItem('theme', d ? 'dark' : 'light'); localStorage.setItem('usbudget_lang', l); }, [!!process.env.DARK, process.env.LANG === 'en' ? 'en' : 'uk']);
for (const t of tabs) { await p.goto('http://localhost:8766/?tab=' + t); await p.waitForTimeout(900); await p.screenshot({ path: out + t + '.png' }); }
console.log(errs.length ? 'PAGE ERRORS: ' + JSON.stringify(errs) : 'ok, no page errors'); await b.close();
})();
