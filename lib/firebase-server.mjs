// Серверний доступ до Firebase без важкого firebase-admin:
// сервісний акаунт → OAuth-токен (обходить правила бази, як Admin SDK) і перевірка ID-токена користувача.
import { createSign } from 'node:crypto';

export const DB = (process.env.FIREBASE_DB_URL || 'https://ourbudget-73f05-default-rtdb.firebaseio.com').replace(/\/$/, '');
// Публічний ключ веб-застосунку (той самий, що в index.html); він не секретний
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyC40zPZ1sq2jNlHmG-sBCz-WySdcCPxeAE';
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';

let cached = null;

// Повертає OAuth-токен сервісного акаунта або null, якщо FIREBASE_SERVICE_ACCOUNT не задано
export async function adminToken(fetchImpl = fetch, now = Date.now()) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  if (cached && cached.exp - 60_000 > now) return cached.token;
  const sa = JSON.parse(raw);
  const iat = Math.floor(now / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 });
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig })
  });
  if (!r.ok) throw new Error('service account token: HTTP ' + r.status);
  const j = await r.json();
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

// URL шляху в базі з токеном сервісного акаунта (якщо він є)
export async function dbUrl(path, fetchImpl = fetch) {
  const t = await adminToken(fetchImpl);
  return `${DB}/${path}.json` + (t ? '?access_token=' + encodeURIComponent(t) : '');
}

// Перевіряє Firebase ID-токен із заголовка Authorization і повертає uid або null.
// Якщо сервер має доступ до бази, uid додатково має бути в members/.
export async function verifyMember(request, fetchImpl = fetch) {
  const m = /^Bearer (.+)$/.exec(request.headers.get('authorization') || '');
  if (!m) return null;
  const r = await fetchImpl(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: m[1] })
  });
  if (!r.ok) return null;
  const j = await r.json();
  const uid = j.users && j.users[0] && j.users[0].localId;
  if (!uid) return null;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return uid;
  const mr = await fetchImpl(await dbUrl('members/' + encodeURIComponent(uid), fetchImpl));
  return mr.ok && (await mr.json()) === true ? uid : null;
}
