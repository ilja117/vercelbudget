// «Нові з картки»: розбір платежу, що прийшов із телефона (iPhone «Команди», Android-автоматизатор).
import { createHash, timingSafeEqual } from 'node:crypto';

const CUR = [[/₴|грн|uah/i, 'UAH'], [/\$|usd/i, 'USD'], [/€|eur/i, 'EUR'], [/zł|pln/i, 'PLN'], [/£|gbp/i, 'GBP']];

// «1 234,56 ₴», «₴482,00», «UAH 1,234.50», 482 → { amount, currency }
export function parseMoney(v) {
  if (typeof v === 'number') return isFinite(v) ? { amount: Math.abs(v), currency: null } : null;
  const s = String(v == null ? '' : v);
  const m = s.match(/\d[\d\s  .,']*/);
  if (!m) return null;
  let n = m[0].replace(/[\s  ']/g, '').replace(/[.,]$/, '');
  const lc = n.lastIndexOf(','), ld = n.lastIndexOf('.');
  if (lc > -1 && ld > -1) n = lc > ld ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
  else if (lc > -1) n = /,\d{1,2}$/.test(n) && n.split(',').length === 2 ? n.replace(',', '.') : n.replace(/,/g, '');
  else if (n.split('.').length > 2) n = n.replace(/\./g, '');
  const amount = Number(n);
  if (!isFinite(amount)) return null;
  const c = CUR.find(([re]) => re.test(s));
  return { amount: Math.round(amount * 100) / 100, currency: c ? c[1] : null };
}

const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Тіло запиту → платіж або { error }
export function normalize(body) {
  const b = body && typeof body === 'object' ? body : {};
  const money = parseMoney(b.amount != null && b.amount !== '' ? b.amount : b.text);
  if (!money || !(money.amount > 0) || money.amount >= 1e7) return { error: 'amount' };
  return {
    amount: money.amount,
    currency: str(b.currency, 3).toUpperCase() || money.currency || '',
    merchant: str(b.merchant, 80) || 'Покупка',
    card: str(b.card, 40),
    src: ['iphone', 'android', 'mono'].includes(b.src) ? b.src : 'phone'
  };
}

// Хто надіслав: ключ порівнюється з settings.inboxKeys = { p1, p2 }
export function whoByKey(keys, k) {
  if (!keys || typeof k !== 'string' || k.length < 20) return null;
  const h = x => createHash('sha256').update(String(x)).digest();
  for (const who of ['p1', 'p2']) if (typeof keys[who] === 'string' && keys[who].length >= 20 && timingSafeEqual(h(keys[who]), h(k))) return who;
  return null;
}

// Однаковий платіж, надісланий двічі за хвилину, — один запис
export function itemId(who, it, ts) {
  return createHash('sha256').update([who, it.amount, it.merchant, Math.floor(ts / 60000)].join('|')).digest('hex').slice(0, 16);
}
