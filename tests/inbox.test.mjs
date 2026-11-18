import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, normalize, whoByKey, itemId, isDuplicate } from '../lib/inbox.mjs';

test('суми з iPhone і Android у різних форматах', () => {
  const c = (s, a, cur) => { const r = parseMoney(s); assert.equal(r.amount, a, s); if (cur !== undefined) assert.equal(r.currency, cur, s); };
  c('₴482,00', 482, 'UAH');
  c('1 234,56 ₴', 1234.56, 'UAH');
  c('1 234,5 грн', 1234.5, 'UAH');
  c('UAH 1,234.50', 1234.5, 'UAH');
  c('$12.99', 12.99, 'USD');
  c('-150,00 €', 150, 'EUR');
  c('1,234', 1234, null);
  c('1.234.567', 1234567, null);
  c('Покупка 89.90 UAH Сільпо', 89.9, 'UAH');
  c(250, 250, null);
  assert.equal(parseMoney('немає суми'), null);
});

test('тіло запиту: суму обов’язково, решта підчищається', () => {
  assert.deepEqual(normalize({ amount: '₴482,00', merchant: '  Сільпо\n', card: 'Mono Black', src: 'iphone' }), { amount: 482, currency: 'UAH', merchant: 'Сільпо', card: 'Mono Black', src: 'iphone' });
  assert.equal(normalize({ text: 'Оплата 99,5 грн АТБ' }).amount, 99.5);
  assert.equal(normalize({ merchant: 'X' }).error, 'amount');
  assert.equal(normalize({ amount: '0' }).error, 'amount');
  assert.equal(normalize({ amount: 99999999 }).error, 'amount');
  assert.equal(normalize({ amount: 5, src: 'evil' }).src, 'phone');
  assert.equal(normalize({ amount: 5, merchant: 'a'.repeat(500) }).merchant.length, 80);
});

test('ключ: лише точний збіг, короткі відкидаються', () => {
  const keys = { p1: 'A'.repeat(32), p2: 'B'.repeat(32) };
  assert.equal(whoByKey(keys, 'A'.repeat(32)), 'p1');
  assert.equal(whoByKey(keys, 'B'.repeat(32)), 'p2');
  assert.equal(whoByKey(keys, 'C'.repeat(32)), null);
  assert.equal(whoByKey(keys, ''), null);
  assert.equal(whoByKey({ p1: 'short' }, 'short'), null);
  assert.equal(whoByKey(null, 'A'.repeat(32)), null);
});

test('повтор за ту саму хвилину — той самий id', () => {
  const it = { amount: 10, merchant: 'Кава' };
  assert.equal(itemId('p1', it, 60000 * 5 + 1), itemId('p1', it, 60000 * 5 + 59000));
  assert.notEqual(itemId('p1', it, 60000 * 5), itemId('p2', it, 60000 * 5));
  assert.notEqual(itemId('p1', it, 60000 * 5), itemId('p1', it, 60000 * 6));
});

test('приймач: ключ → запис у inbox; чужий ключ → 401', async () => {
  const { generateKeyPairSync } = await import('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ client_email: 't@t', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
  const db = { 'shared_budget_data/settings/inboxKeys': { p1: 'K'.repeat(32), p2: 'L'.repeat(32) }, 'shared_budget_data/inbox': null };
  const puts = [];
  globalThis.fetch = async (url, o = {}) => {
    if (url.startsWith('https://oauth2')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    const path = new URL(url).pathname.slice(1).replace(/\.json$/, '');
    if (o.method === 'PUT') { puts.push([path, JSON.parse(o.body)]); return new Response('{}'); }
    return new Response(JSON.stringify(db[path] ?? null));
  };
  const { POST } = await import('../api/inbox.js');
  const req = (k, body) => new Request('https://x.test/api/inbox?k=' + k, { method: 'POST', body: JSON.stringify(body) });
  let r = await POST(req('L'.repeat(32), { amount: '₴482,00', merchant: 'Сільпо', src: 'iphone' }));
  assert.equal(r.status, 200);
  assert.equal(puts.length, 1);
  assert.match(puts[0][0], /^shared_budget_data\/inbox\/[0-9a-f]{16}$/);
  assert.equal(puts[0][1].who, 'p2');
  assert.equal(puts[0][1].amount, 482);
  r = await POST(req('Z'.repeat(32), { amount: 5 }));
  assert.equal(r.status, 401);
  r = await POST(req('K'.repeat(32), { merchant: 'без суми' }));
  assert.equal(r.status, 400);
  assert.equal(puts.length, 1);
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
});

test('Android: сирий текст сповіщення різних банків', () => {
  const n = (title, text) => normalize({ title, text, src: 'android' });
  let r = n('Приват24', 'Покупка 482.00 UAH Сільпо. Картка *1234. Бал. 10 234.56 UAH');
  assert.equal(r.amount, 482); assert.equal(r.merchant, 'Сільпо'); assert.equal(r.currency, 'UAH'); assert.match(r.raw, /Приват24/);
  r = n('monobank', '🛒 Сільпо -482.00₴ Баланс 5 000.00₴'); assert.equal(r.amount, 482); assert.equal(r.merchant, 'Сільпо');
  r = n('ПриватБанк', 'Списання 1 200,00 UAH. NOVA POSHTA. Залишок 3 400,00 UAH'); assert.equal(r.amount, 1200); assert.equal(r.merchant, 'NOVA POSHTA');
  r = n('Starbucks', '₴155.00 with Visa •••• 1234'); assert.equal(r.amount, 155); assert.equal(r.merchant, 'Starbucks');
  r = n('', 'Оплата 89,90 грн, АТБ-маркет, картка **5678 14:32'); assert.equal(r.amount, 89.9); assert.equal(r.merchant, 'АТБ-маркет');
  assert.equal(n('Приват24', 'Зарахування 5000.00 UAH від Іван').error, 'not purchase');
  assert.equal(n('monobank', 'Код підтвердження 1234').error, 'not purchase');
  assert.equal(n('monobank', 'Вітаємо!').error, 'amount');
});

test('дубль: та сама сума тієї ж людини за 2 хвилини', () => {
  const ex = { a: { who: 'p1', amount: 482, ts: 1000000 } };
  assert.equal(isDuplicate(ex, 'p1', { amount: 482 }, 1000000 + 90000), true);
  assert.equal(isDuplicate(ex, 'p1', { amount: 482 }, 1000000 + 180000), false);
  assert.equal(isDuplicate(ex, 'p2', { amount: 482 }, 1000000 + 1000), false);
  assert.equal(isDuplicate(ex, 'p1', { amount: 483 }, 1000000 + 1000), false);
});

test('приймач Android: параметри з посилання, dry, дубль', async () => {
  const { generateKeyPairSync } = await import('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ client_email: 't@t', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
  const db = { 'shared_budget_data/settings/inboxKeys': { p1: 'K'.repeat(32) }, 'shared_budget_data/inbox': {} };
  const puts = [];
  globalThis.fetch = async (url, o = {}) => {
    if (url.startsWith('https://oauth2')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    const path = new URL(url).pathname.slice(1).replace(/\.json$/, '');
    if (o.method === 'PUT') { const v = JSON.parse(o.body); puts.push(v); db['shared_budget_data/inbox'][v.id] = v; return new Response('{}'); }
    return new Response(JSON.stringify(db[path] ?? null));
  };
  const { POST } = await import('../api/inbox.js?android');
  const q = (extra) => new Request('https://x.test/api/inbox?k=' + 'K'.repeat(32) + '&src=android&title=' + encodeURIComponent('Приват24') + '&text=' + encodeURIComponent('Покупка 482.00 UAH Сільпо. Бал. 9 000.00 UAH') + extra, { method: 'POST' });
  let j = await (await POST(q('&dry=1'))).json();
  assert.equal(j.dry, true); assert.equal(j.item.amount, 482); assert.equal(j.item.merchant, 'Сільпо'); assert.equal(puts.length, 0);
  j = await (await POST(q(''))).json();
  assert.equal(j.ok, true); assert.equal(puts.length, 1); assert.equal(puts[0].src, 'android');
  j = await (await POST(q(''))).json();
  assert.equal(j.ignored, 'duplicate'); assert.equal(puts.length, 1);
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
});

test('справжні сповіщення monobank, Privat24 і Google Гаманця', () => {
  const n = (title, text) => normalize({ title, text, src: 'android' });
  // вхідний переказ — пропустити
  assert.equal(n('👉💳 0.50₴', 'Від: Сергій Зоммер\nБаланс 9 247.64₴ 🥷').error, 'not purchase');
  assert.equal(n('Privat24', '+500₴ Переказ з картки. 5*36 10:00 Бал. 900₴').error, 'not purchase');
  // реакція на переказ — без суми
  assert.equal(n('Відповідь на ваш переказ', 'Сергій З. реагує: «🐷»').error, 'amount');
  // вихідний переказ людині: ініціал не губиться
  let r = n('👈💳 1.00₴', 'Сергій З.\nБаланс 9 247.14₴ 🥷');
  assert.equal(r.amount, 1); assert.equal(r.merchant, 'Сергій З');
  // покупка в monobank: сума з назви, баланс відкинуто
  r = n('📦 2 006.13₴', 'AliExpress\nБаланс 9 248.14₴ 🥷');
  assert.equal(r.amount, 2006.13); assert.equal(r.merchant, 'AliExpress');
  // Privat24: категорія банку, маска картки, час, баланс і ліміт відкинуто
  r = n('Privat24', '-30₴ Транспорт. IPAY   *KYIVTR, KYIV\n5*36 22:30\nБал. 23 824.68₴\nКред. ліміт 20 000₴');
  assert.equal(r.amount, 30); assert.equal(r.merchant, 'IPAY *KYIVTR KYIV');
  // Google Гаманець: магазин у заголовку, картка в тексті
  r = n('IPAY   *KYIVTR', '30,00 грн – Mastercard PrivatBank ••9236');
  assert.equal(r.amount, 30); assert.equal(r.merchant, 'IPAY *KYIVTR');
  // той самий платіж від банку й Гаманця — дубль
  assert.equal(isDuplicate({ a: { who: 'p1', amount: 30, ts: 1000 } }, 'p1', { amount: 30 }, 1000 + 20000), true);
});
