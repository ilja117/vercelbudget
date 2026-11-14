// Курси для конвертера (публічні дані, без ключів). Кеш на сервері Vercel — 5 хвилин.
import { loadRates } from '../lib/rates.mjs';

export async function GET() {
  const data = await loadRates();
  if (!Object.keys(data.items).length) return Response.json({ error: 'no data', missing: data.missing }, { status: 502 });
  return Response.json(data, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
}
