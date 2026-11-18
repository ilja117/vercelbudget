// Серверні запасні копії бюджету (v6.11): щоночі разом із нагадуваннями й за кнопкою.
// Дані — backups/<id> (повне дерево shared_budget_data без «Нові з картки»), опис — backup_meta/<id>.
import { dbUrl } from './firebase-server.mjs';

export const KEEP_DAYS = 30;
export const KEEP_MAX = 60;
const DAY = 86400000;

// Скільки записів (усе, що має суму) у дереві
export function countRecords(tree) {
  let n = 0;
  const walk = v => { if (!v || typeof v !== 'object') return; if ('amount' in v && 'id' in v) { n++; return; } Object.values(v).forEach(walk); };
  walk(tree);
  return n;
}

export const backupId = ts => 'b' + ts;

// Які копії видалити: старші за KEEP_DAYS або понад KEEP_MAX найновіших
export function toPrune(meta, now) {
  const list = Object.entries(meta || {}).filter(([, m]) => m && m.ts).sort((a, b) => b[1].ts - a[1].ts);
  return list.filter(([, m], i) => i >= KEEP_MAX || now - m.ts > KEEP_DAYS * DAY).map(([id]) => id);
}

// Зробити копію зараз; reason: auto | manual | before-restore
export async function makeBackup({ fetchImpl = fetch, now = Date.now(), reason = 'auto' } = {}) {
  const r = await fetchImpl(await dbUrl('shared_budget_data', fetchImpl));
  const data = r.ok ? await r.json() : null;
  if (!data) return { ok: false, error: 'no data' };
  delete data.inbox;
  const id = backupId(now), meta = { ts: now, count: countRecords(data), reason };
  const put = async (path, body) => (await fetchImpl(await dbUrl(path, fetchImpl), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).ok;
  if (!(await put('backups/' + id, data))) return { ok: false, error: 'db' };
  await put('backup_meta/' + id, meta);
  const mr = await fetchImpl(await dbUrl('backup_meta', fetchImpl));
  const old = toPrune(mr.ok ? await mr.json() : null, now);
  for (const o of old) {
    await fetchImpl(await dbUrl('backups/' + o, fetchImpl), { method: 'DELETE' });
    await fetchImpl(await dbUrl('backup_meta/' + o, fetchImpl), { method: 'DELETE' });
  }
  return { ok: true, id, ...meta, pruned: old.length };
}
