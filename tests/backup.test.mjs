import test from 'node:test';
import assert from 'node:assert/strict';
import { countRecords, toPrune, makeBackup, KEEP_MAX } from '../lib/backup.mjs';

const DAY = 86400000;

test('countRecords: рахує записи з сумою на будь-якій глибині', () => {
  assert.equal(countRecords({ expenses: { a: { id: 'a', amount: 1 }, b: { id: 'b', amount: 2 } }, personalExpenses: { p1: { c: { id: 'c', amount: 3 } } }, settings: { currency: '₴' } }), 3);
  assert.equal(countRecords(null), 0);
});

test('toPrune: старші за 30 днів і понад ліміт — видалити', () => {
  const now = 100 * DAY;
  const meta = { old: { ts: now - 31 * DAY }, fresh: { ts: now - 29 * DAY }, today: { ts: now } };
  assert.deepEqual(toPrune(meta, now), ['old']);
  const many = {}; for (let i = 0; i < KEEP_MAX + 2; i++) many['b' + i] = { ts: now - i * 1000 };
  assert.deepEqual(toPrune(many, now), ['b' + KEEP_MAX, 'b' + (KEEP_MAX + 1)]);
});

test('makeBackup: копія без «Нові з картки», опис і чистка старих', async () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  const now = 100 * DAY, calls = [];
  const db = { shared_budget_data: { expenses: { a: { id: 'a', amount: 5 } }, inbox: { x: { id: 'x', amount: 1 } } }, backup_meta: { bOld: { ts: now - 40 * DAY } } };
  const fetchImpl = async (url, o = {}) => {
    const path = url.split('.firebaseio.com/')[1].replace(/\.json.*$/, '');
    calls.push([o.method || 'GET', path]);
    if (o.method === 'PUT') { if (path.startsWith('backup_meta/')) db.backup_meta[path.split('/')[1]] = JSON.parse(o.body); else db[path] = JSON.parse(o.body); return { ok: true }; }
    if (o.method === 'DELETE') return { ok: true };
    return { ok: true, json: async () => JSON.parse(JSON.stringify(db[path] || null)) };
  };
  const r = await makeBackup({ fetchImpl, now, reason: 'manual' });
  assert.equal(r.ok, true); assert.equal(r.count, 1); assert.equal(r.pruned, 1);
  assert.deepEqual(db['backups/b' + now], { expenses: { a: { id: 'a', amount: 5 } } });
  assert.deepEqual(db.backup_meta['b' + now], { ts: now, count: 1, reason: 'manual' });
  assert.ok(calls.some(c => c[0] === 'DELETE' && c[1] === 'backups/bOld'));
  assert.ok(calls.some(c => c[0] === 'DELETE' && c[1] === 'backup_meta/bOld'));
});

test('api/backup: без сервісного акаунта — 503, без входу — 401', async () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  const { GET, POST } = await import('../api/backup.js');
  assert.equal((await GET(new Request('http://x/api/backup'))).status, 503);
  assert.equal((await POST(new Request('http://x/api/backup', { method: 'POST' }))).status, 503);
});

test('ранкове сповіщення: «Нові з картки», що чекають з учора', async () => {
  const { messageFor } = await import('../lib/schedule.mjs');
  const t = '2026-11-18', ts = d => new Date(d + 'T10:00:00Z').getTime();
  const data = { inbox: { a: { who: 'p1', ts: ts('2026-11-16') }, b: { who: 'p1', ts: ts('2026-11-17') }, c: { who: 'p1', ts: ts(t) }, d: { who: 'p2', ts: ts('2026-10-28') } } };
  assert.equal(messageFor(data, 'p1', t).body, 'Нові з картки: 2 чекають, найстаріший — 2 дні');
  assert.equal(messageFor(data, 'p2', t).body, 'Нові з картки: 1 чекає, найстаріший — 21 день');
  assert.equal(messageFor({ inbox: { c: { who: 'p1', ts: ts(t) } } }, 'p1', t), null); // сьогоднішні не нагадуємо
  const withRent = { ...data, fixedExpenses: { a: { id: 'a', title: 'Оренда', amount: 100, frequency: 'month', startDate: '2026-01-18', scope: 'shared' } } };
  assert.equal(messageFor(withRent, 'p1', t).body, 'Сьогодні: Оренда — 100 ₴\nНові з картки: 2 чекають, найстаріший — 2 дні');
});
