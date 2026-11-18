// Приймач платежів із телефона: POST /api/inbox?k=<особистий ключ> { amount, merchant, card, src }
// Платіж лягає в shared_budget_data/inbox і чекає підтвердження в застосунку.
import { dbUrl, adminToken } from '../lib/firebase-server.mjs';
import { normalize, whoByKey, itemId } from '../lib/inbox.mjs';

const MAX_WAITING = 300;

async function readBody(request) {
  const raw = await request.text();
  try { return JSON.parse(raw); } catch (e) {}
  const p = new URLSearchParams(raw), o = {};
  for (const [k, v] of p) o[k] = v;
  return Object.keys(o).length && !(Object.keys(o).length === 1 && o[raw] === '') ? o : { text: raw };
}

export async function POST(request) {
  if (!(await adminToken().catch(() => null))) return Response.json({ ok: false, error: 'server not configured' }, { status: 503 });
  const url = new URL(request.url);
  const body = await readBody(request);
  const key = request.headers.get('x-key') || url.searchParams.get('k') || body.key;
  const kr = await fetch(await dbUrl('shared_budget_data/settings/inboxKeys'));
  const who = whoByKey(kr.ok ? await kr.json() : null, key);
  if (!who) return Response.json({ ok: false, error: 'bad key' }, { status: 401 });
  const it = normalize(body);
  if (it.error) return Response.json({ ok: false, error: 'no amount' }, { status: 400 });
  const cr = await fetch((await dbUrl('shared_budget_data/inbox')) + '&shallow=true');
  const waiting = cr.ok ? Object.keys((await cr.json()) || {}).length : 0;
  if (waiting >= MAX_WAITING) return Response.json({ ok: false, error: 'inbox full' }, { status: 429 });
  const ts = Date.now(), id = itemId(who, it, ts);
  const w = await fetch(await dbUrl('shared_budget_data/inbox/' + id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, who, ts, ...it }) });
  if (!w.ok) return Response.json({ ok: false, error: 'db' }, { status: 502 });
  return Response.json({ ok: true, text: 'UsBudget: ' + it.merchant + ' ' + it.amount + (it.currency ? ' ' + it.currency : '') });
}
