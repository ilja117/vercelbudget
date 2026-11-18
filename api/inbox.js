// Приймач платежів із телефона: POST /api/inbox?k=<особистий ключ>
// iPhone: JSON { amount, merchant, card, src }. Android (MacroDroid): параметри ?src=android&title=…&text=… (сирий текст сповіщення).
// &dry=1 — лише показати, що розпізнано, без запису. Платіж лягає в shared_budget_data/inbox і чекає підтвердження.
import { dbUrl, adminToken } from '../lib/firebase-server.mjs';
import { normalize, whoByKey, itemId, isDuplicate } from '../lib/inbox.mjs';

const MAX_WAITING = 300;
const FIELDS = ['amount', 'merchant', 'card', 'src', 'title', 'text', 'currency'];

async function readBody(request) {
  const raw = await request.text();
  if (!raw) return {};
  try { const j = JSON.parse(raw); return j && typeof j === 'object' ? j : { text: raw }; } catch (e) {}
  if (/^[\w.%+-]+=/.test(raw)) { const o = {}; for (const [k, v] of new URLSearchParams(raw)) o[k] = v; return o; }
  return { text: raw };
}

export async function POST(request) {
  if (!(await adminToken().catch(() => null))) return Response.json({ ok: false, error: 'server not configured' }, { status: 503 });
  const url = new URL(request.url);
  const body = await readBody(request);
  for (const f of FIELDS) if ((body[f] == null || body[f] === '') && url.searchParams.has(f)) body[f] = url.searchParams.get(f);
  const key = request.headers.get('x-key') || url.searchParams.get('k') || body.key;
  const kr = await fetch(await dbUrl('shared_budget_data/settings/inboxKeys'));
  const who = whoByKey(kr.ok ? await kr.json() : null, key);
  if (!who) return Response.json({ ok: false, error: 'bad key' }, { status: 401 });
  const it = normalize(body);
  const dry = url.searchParams.get('dry') === '1';
  if (it.error === 'not purchase') return Response.json({ ok: true, ignored: 'not purchase' });
  if (it.error) return Response.json({ ok: false, error: 'no amount' }, { status: dry ? 200 : 400 });
  if (dry) return Response.json({ ok: true, dry: true, item: it });
  const cr = await fetch(await dbUrl('shared_budget_data/inbox'));
  const waiting = cr.ok ? ((await cr.json()) || {}) : {};
  if (Object.keys(waiting).length >= MAX_WAITING) return Response.json({ ok: false, error: 'inbox full' }, { status: 429 });
  const ts = Date.now();
  if (it.src !== 'test' && isDuplicate(waiting, who, it, ts)) return Response.json({ ok: true, ignored: 'duplicate' });
  const id = itemId(who, it, ts);
  const w = await fetch(await dbUrl('shared_budget_data/inbox/' + id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, who, ts, ...it }) });
  if (!w.ok) return Response.json({ ok: false, error: 'db' }, { status: 502 });
  return Response.json({ ok: true, text: 'UsBudget: ' + it.merchant + ' ' + it.amount + (it.currency ? ' ' + it.currency : '') });
}
