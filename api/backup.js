// Запасні копії на сервері — лише для учасників бюджету (Firebase ID-токен у Authorization).
// GET — список; GET ?id=<id> — дані копії; POST { reason } — зробити копію зараз.
import { adminToken, dbUrl, verifyMember } from '../lib/firebase-server.mjs';
import { makeBackup } from '../lib/backup.mjs';

async function guard(request) {
  if (!(await adminToken().catch(() => null))) return Response.json({ ok: false, error: 'server not configured' }, { status: 503 });
  if (!(await verifyMember(request).catch(() => null))) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  return null;
}

export async function GET(request) {
  const bad = await guard(request); if (bad) return bad;
  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    if (!/^b\d{10,16}$/.test(id)) return Response.json({ ok: false, error: 'bad id' }, { status: 400 });
    const r = await fetch(await dbUrl('backups/' + id));
    const data = r.ok ? await r.json() : null;
    return data ? Response.json({ ok: true, data }) : Response.json({ ok: false, error: 'not found' }, { status: 404 });
  }
  const r = await fetch(await dbUrl('backup_meta'));
  const meta = (r.ok ? await r.json() : null) || {};
  const list = Object.entries(meta).filter(([, m]) => m && m.ts).map(([id, m]) => ({ id, ts: m.ts, count: m.count || 0, reason: m.reason || 'auto' })).sort((a, b) => b.ts - a.ts);
  return Response.json({ ok: true, list });
}

export async function POST(request) {
  const bad = await guard(request); if (bad) return bad;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const reason = body && body.reason === 'before-restore' ? 'before-restore' : 'manual';
  const res = await makeBackup({ reason });
  return Response.json(res, { status: res.ok ? 200 : 502 });
}
