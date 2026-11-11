// Тестове сповіщення на щойно підписаний пристрій
import webpush from 'web-push';
import { verifyMember } from '../lib/firebase-server.mjs';

export async function POST(request) {
  // З REQUIRE_AUTH=1 — лише для учасників бюджету (вмикається разом із входом у застосунку)
  if (process.env.REQUIRE_AUTH === '1' && !(await verifyMember(request).catch(() => null))) return new Response('Unauthorized', { status: 401 });
  let body;
  try { body = await request.json(); } catch (e) { return new Response('bad json', { status: 400 }); }
  const sub = body && body.subscription;
  if (!sub || !sub.endpoint) return new Response('no subscription', { status: 400 });
  webpush.setVapidDetails('mailto:' + (process.env.VAPID_CONTACT || 'usbudget@example.com'), process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title: 'UsBudget', body: 'Сповіщення працюють ✓', url: './' }));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, status: (e && e.statusCode) || 0 }, { status: 502 });
  }
}
