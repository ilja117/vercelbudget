// «Нові з картки»: розбір платежу, що прийшов із телефона (iPhone «Команди», Android MacroDroid).
import { createHash, timingSafeEqual } from 'node:crypto';

const CUR = [[/₴|грн|uah/i, 'UAH'], [/\$|usd/i, 'USD'], [/€|eur/i, 'EUR'], [/zł|pln/i, 'PLN'], [/£|gbp/i, 'GBP']];
const CUR_RE = '₴|грн\\.?|uah|\\$|usd|€|eur|zł|pln|£|gbp';
const NUM_RE = "\\d[\\d \\u00a0\\u202f.,']*\\d|\\d";
// Сума поруч із валютою важливіша за перше-ліпше число (у сповіщеннях є номер картки, баланс, час)
const NEAR = new RegExp('(?:' + CUR_RE + ')\\s?(' + NUM_RE + ')|(' + NUM_RE + ')\\s?(?:' + CUR_RE + ')', 'i');
const MONEY_ALL = new RegExp('[−\\-+]?(?:(?:' + CUR_RE + ')\\s?(?:' + NUM_RE + ')|(?:' + NUM_RE + ')\\s?(?:' + CUR_RE + '))', 'gi');
const MASK = /[*•·x×]{1,6}\s?\d{4}|\d{4}\s?[*•·x×]{2,}|\b\d{1,2}:\d{2}(?::\d{2})?\b|\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/gi;

function toNumber(raw) {
  let n = raw.replace(/[\s  ']/g, '').replace(/[.,]$/, '');
  const lc = n.lastIndexOf(','), ld = n.lastIndexOf('.');
  if (lc > -1 && ld > -1) n = lc > ld ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
  else if (lc > -1) n = /,\d{1,2}$/.test(n) && n.split(',').length === 2 ? n.replace(',', '.') : n.replace(/,/g, '');
  else if (n.split('.').length > 2) n = n.replace(/\./g, '');
  return Number(n);
}

// «1 234,56 ₴», «₴482,00», «UAH 1,234.50», «Покупка 89.90 UAH, картка *1234», 482 → { amount, currency }
export function parseMoney(v) {
  if (typeof v === 'number') return isFinite(v) ? { amount: Math.abs(v), currency: null } : null;
  const s = String(v == null ? '' : v).replace(MASK, ' ');
  const near = s.match(NEAR);
  const raw = near ? (near[1] || near[2]) : (s.match(/\d[\d\s  .,']*/) || [])[0];
  if (!raw) return null;
  const amount = toNumber(raw);
  if (!isFinite(amount)) return null;
  const c = CUR.find(([re]) => re.test(near ? near[0] : s));
  return { amount: Math.round(amount * 100) / 100, currency: c ? c[1] : null };
}

const str = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// Не покупки: зарахування, коди, вхід. Слова покупки переважують.
const NOT_BUY = /зарахуван|надходжен|надійшл|поповненн|отрима(?:но|ли)|повернення|cashback|кешбек|(?:^|\s)код(?:\s|$)|code|парол|password|вхід у|login/i;
// Реклама банку: промокоди, розіграші — завжди пропускати
const PROMO = /промо-?код|виграл|виграш|розіграш|promo ?code/i;
const BUY = /покупк|оплат|списан|сплачен|purchase|payment|paid|spent/i;
const BANKS = /^(monobank|mono|приват24|privat24|приватбанк|privatbank|privat|google wallet|google pay|wallet|ощадбанк|oschadbank|пумб|pumb|sense|abank|а-банк|raiffeisen|райффайзен|укрсиббанк|ukrsibbank|izibank|банк|bank)$/i;
const NOISE = /(?:^|\s)(?:успішна|покупка|оплата|списання|сплачено|оплачено|purchase|payment|paid|spent|at|в|у|на суму|сума|картка|картки|карта|card|visa|mastercard|maestro|privatbank|приватбанк|monobank)(?=\s|$|[.,:])/gi;
const SHORT = /(?:^|\s)(?:в|у|з|at|from|with)(?=\s|$|[,:])/gi;
const PRIVAT_CAT = /^(?:Транспорт|Продукти|Супермаркети|Ресторани|Кафе|Одяг|Аптеки|Розваги|Комунальні|Подорожі|Авто|Магазини|Різне|Спорт|Краса|Освіта|Зв.язок)\.\s+/i;

// Назва магазину з тексту сповіщення: прибрати суму, картку, час, баланс і службові слова
export function merchantFrom(...parts) {
  for (const p of parts) {
    let t = String(p || '');
    t = t.replace(/\p{Extended_Pictographic}/gu, ' ').replace(/(?:бал(?:анс)?|залишок|доступно)(?=[\s.:]|$).*$/i, ' ');
    t = t.replace(MONEY_ALL, ' ').replace(MASK, ' ').replace(/[|•·:;,]+/g, ' ');
    t = t.replace(/\d+\*\d+/g, ' ').replace(NOISE, ' ').replace(NOISE, ' ').replace(SHORT, ' ').replace(/(?:^|\s)[.\-–—]+(?=\s|$)/g, ' ').replace(/^\s+/, '').replace(PRIVAT_CAT, '').replace(/\s+/g, ' ').trim().replace(/^[\-–—.\s]+|[\-–—.\s]+$/g, '');
    if (/[a-zа-яіїєґ]{2,}/i.test(t) && !BANKS.test(t)) return t.slice(0, 80);
  }
  return '';
}

// Вхідні гроші: monobank «Від: …», зарахування, або перша сума з плюсом («+500₴»)
const INCOMING = /(?:^|[\s·])від:\s|(?:^|[\s·])from:\s|зарахуван|надходжен|надійшл|поповненн/i;
const IN_NOISE = /(?:^|\s)(?:зарахування|переказу?|надходження|поповнення|карти|карту|картку|картки|на|від|from|transfer)(?=\s|$|[.,:])/gi;
const CARD_TO = /\d{4,6}\*{2,}\d{4}/;
function isIncoming(raw) {
  if (INCOMING.test(raw)) return true;
  const first = (raw.replace(MASK, ' ').match(MONEY_ALL) || [])[0];
  return !!first && first.trim().startsWith('+');
}

// Тіло запиту → платіж або { error }. Android шле сирий текст сповіщення: title + text.
export function normalize(body) {
  const b = body && typeof body === 'object' ? body : {};
  const title = str(b.title, 200), text = str(b.text, 400);
  const raw = [title, text].filter(Boolean).join(' · ');
  const direct = b.amount != null && b.amount !== '';
  const incoming = !direct && !!raw && isIncoming(raw);
  if (!direct && raw && (PROMO.test(raw) || (!incoming && NOT_BUY.test(raw) && !BUY.test(raw)))) return { error: 'not purchase' };
  const money = parseMoney(direct ? b.amount : raw);
  if (!money || !(money.amount > 0) || money.amount >= 1e7) return { error: 'amount' };
  const out = {
    amount: money.amount,
    currency: str(b.currency, 3).toUpperCase() || money.currency || '',
    merchant: str(b.merchant, 80) || (incoming ? merchantFrom(text.replace(IN_NOISE, ' '), title.replace(IN_NOISE, ' ')) || 'Надходження' : merchantFrom(text, title) || (CARD_TO.test(raw) ? 'Переказ на картку' : 'Покупка')),
    card: str(b.card, 40),
    src: ['iphone', 'android', 'mono', 'test'].includes(b.src) ? b.src : 'phone'
  };
  if (incoming) out.kind = 'in';
  if (raw && !b.merchant) out.raw = raw.slice(0, 200);
  return out;
}

// Те саме сповіщення двічі (банк + Google Wallet) за 2 хвилини — дубль; надходження й витрата — різні
export function isDuplicate(existing, who, it, ts) {
  return Object.values(existing || {}).some(x => x && x.who === who && (x.kind || '') === (it.kind || '') && Math.abs(x.amount - it.amount) < 0.005 && Math.abs((x.ts || 0) - ts) <= 120000);
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
