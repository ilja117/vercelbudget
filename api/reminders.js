// Щоденні нагадування про регулярні платежі. Запускає Vercel Cron (див. vercel.json)
import webpush from 'web-push';
import { kyivToday, messageFor } from '../lib/schedule.mjs';
import { dbUrl } from '../lib/firebase-server.mjs';

export async function runReminders({ fetchImpl = fetch, push = webpush, now = new Date() } = {}) {
  push.setVapidDetails('mailto:' + (process.env.VAPID_CONTACT || 'usbudget@example.com'), process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const get = async path => { const r = await fetchImpl(await dbUrl(path, fetchImpl)); return r.ok ? r.json() : null; };
  const [data, subs] = await Promise.all([get('shared_budget_data'), get('push_subs')]);
  if (!data) return { sent: 0, removed: 0, reason: 'no data (перевірте FIREBASE_SERVICE_ACCOUNT)' };
  const today = kyivToday(now);
  let sent = 0, removed = 0;
  for (const [key, s] of Object.entries(subs || {})) {
    if (!s || !s.subscription) continue;
    const msg = messageFor(data, s.owner, today);
    if (!msg) continue;
    try { await push.sendNotification(s.subscription, JSON.stringify(msg)); sent++; }
    catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { await fetchImpl(await dbUrl(`push_subs/${key}`, fetchImpl), { method: 'DELETE' }); removed++; }
    }
  }
  return { sent, removed };
}

// Vercel Cron надсилає GET із заголовком Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  return Response.json(await runReminders());
}
