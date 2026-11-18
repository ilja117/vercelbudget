import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, normalize, whoByKey, itemId } from '../lib/inbox.mjs';

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
