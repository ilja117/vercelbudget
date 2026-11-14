// Курси для конвертера: усе зводиться до «скільки доларів коштує 1 одиниця».
// Джерела: НБУ (валюти, метали), CoinGecko (крипто), Yahoo (акції, ETF; із затримкою ~15 хв).

export const CRYPTO = { BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', BNB: 'binancecoin', SOL: 'solana', XRP: 'ripple', DOGE: 'dogecoin', TON: 'the-open-network', ADA: 'cardano', LTC: 'litecoin', TRX: 'tron' };
export const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ', 'VOO'];
const METALS = ['XAU', 'XAG', 'XPT', 'XPD'];

const num = v => (typeof v === 'number' && isFinite(v) && v > 0) ? v : null;

// НБУ: [{cc:'USD', rate:41.3}, ...] — гривень за 1 одиницю → долари
export function parseNbu(list) {
  if (!Array.isArray(list)) return {};
  const uah = {};
  for (const r of list) { const v = num(r && r.rate); if (v && r.cc) uah[r.cc] = v; }
  const usd = uah.USD;
  if (!usd) return {};
  const out = { UAH: { usd: 1 / usd, kind: 'fiat' } };
  for (const [cc, v] of Object.entries(uah)) out[cc] = { usd: v / usd, kind: METALS.includes(cc) ? 'metal' : 'fiat' };
  out.USD = { usd: 1, kind: 'fiat' };
  return out;
}

// CoinGecko: {bitcoin:{usd:67000}, ...}
export function parseGecko(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [sym, id] of Object.entries(CRYPTO)) { const v = num(obj[id] && obj[id].usd); if (v) out[sym] = { usd: v, kind: 'crypto' }; }
  return out;
}

// Yahoo chart: {chart:{result:[{meta:{regularMarketPrice, currency}}]}}
export function parseYahoo(sym, obj) {
  const m = obj && obj.chart && obj.chart.result && obj.chart.result[0] && obj.chart.result[0].meta;
  const v = m && num(m.regularMarketPrice);
  if (!v || (m.currency && m.currency !== 'USD')) return null;
  return { usd: v, kind: 'stock' };
}

// Переведення: сума × (долари за «з») ÷ (долари за «в»)
export function convert(amount, from, to, items) {
  const a = items[from], b = items[to];
  if (!a || !b || !isFinite(amount)) return null;
  return amount * a.usd / b.usd;
}

async function getJson(url, ms = 6000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0 UsBudget', Accept: 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function loadRates() {
  const items = {}; const missing = [];
  const jobs = {
    nbu: async () => parseNbu(await getJson('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json')),
    crypto: async () => parseGecko(await getJson('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' + Object.values(CRYPTO).join(','))),
    stocks: async () => {
      const out = {};
      await Promise.all(STOCKS.map(async s => {
        try { const v = parseYahoo(s, await getJson('https://query1.finance.yahoo.com/v8/finance/chart/' + s + '?range=1d&interval=1d')); if (v) out[s] = v; } catch (e) {}
      }));
      return out;
    }
  };
  await Promise.all(Object.entries(jobs).map(async ([k, f]) => {
    try { const r = await f(); if (Object.keys(r).length) Object.assign(items, r); else missing.push(k); } catch (e) { missing.push(k); }
  }));
  return { ts: Date.now(), items, missing };
}
