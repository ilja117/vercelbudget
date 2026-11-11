// npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = { client_email: 'svc@test.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };

const json = (body, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });

test('adminToken: signs a valid RS256 JWT and caches the token', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(SA);
  const { adminToken } = await import('../lib/firebase-server.mjs?a');
  let calls = 0;
  const fetchImpl = async (url, opts) => {
    calls++;
    assert.equal(url, 'https://oauth2.googleapis.com/token');
    const jwt = new URLSearchParams(opts.body).get('assertion');
    const [h, p, sig] = jwt.split('.');
    assert.ok(createVerify('RSA-SHA256').update(h + '.' + p).verify(publicKey, Buffer.from(sig, 'base64url')));
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    assert.equal(claims.iss, SA.client_email);
    assert.match(claims.scope, /firebase\.database/);
    return json({ access_token: 'tok', expires_in: 3600 });
  };
  assert.equal(await adminToken(fetchImpl), 'tok');
  assert.equal(await adminToken(fetchImpl), 'tok');
  assert.equal(calls, 1);
});

test('adminToken: null without a service account', async () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  const { adminToken, dbUrl } = await import('../lib/firebase-server.mjs?b');
  assert.equal(await adminToken(async () => assert.fail('no fetch expected')), null);
  assert.match(await dbUrl('x', async () => {}), /\/x\.json$/);
});

test('verifyMember: requires Bearer token, valid user and members/<uid> === true', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(SA);
  const { verifyMember } = await import('../lib/firebase-server.mjs?c');
  const req = h => new Request('https://x/api', { headers: h });
  const fetchFor = member => async url => {
    if (url.includes('oauth2')) return json({ access_token: 'tok', expires_in: 3600 });
    if (url.includes('accounts:lookup')) return json({ users: [{ localId: 'uid1' }] });
    if (url.includes('/members/uid1.json?access_token=tok')) return json(member);
    throw new Error('unexpected ' + url);
  };
  assert.equal(await verifyMember(req({}), fetchFor(true)), null);
  assert.equal(await verifyMember(req({ authorization: 'Bearer abc' }), fetchFor(true)), 'uid1');
  assert.equal(await verifyMember(req({ authorization: 'Bearer abc' }), fetchFor(null)), null);
  assert.equal(await verifyMember(req({ authorization: 'Bearer bad' }), async () => json({}, false)), null);
});

test('runReminders: reads the database with the service-account token', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(SA);
  const { runReminders } = await import('../api/reminders.js');
  const seen = [];
  const fetchImpl = async url => {
    if (url.includes('oauth2')) return json({ access_token: 'tok', expires_in: 3600 });
    seen.push(url);
    if (url.includes('shared_budget_data')) return json({ fixedExpenses: { a: { id: 'a', title: 'Оренда', amount: 100, frequency: 'month', startDate: '2026-01-11', scope: 'shared' } } });
    if (url.includes('push_subs')) return json({ k: { owner: 'p1', subscription: { endpoint: 'e' } } });
  };
  const sent = [];
  const push = { setVapidDetails() {}, sendNotification: async (s, m) => sent.push(JSON.parse(m)) };
  const r = await runReminders({ fetchImpl, push, now: new Date('2026-11-11T06:00:00Z') });
  assert.ok(seen.every(u => u.includes('access_token=tok')));
  assert.equal(r.sent, 1);
  assert.match(sent[0].body, /Сьогодні: Оренда/);
});
