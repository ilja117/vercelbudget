// Розклад регулярних операцій — та сама логіка, що й у застосунку
export const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const dateOf = s => { const p = String(s).split('-').map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1, 12); };
export const addDays = (iso, n) => { const d = dateOf(iso); return isoOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)); };
const recStart = fx => fx.startDate || (fx.frequency === 'week' ? '2000-01-03' : '2000-01-01');
export const toArr = v => Array.isArray(v) ? v.filter(Boolean) : Object.keys(v || {}).map(k => v[k]).filter(Boolean);

export function fxOccurrences(fx, fromISO, toISO) {
  const out = [], start = recStart(fx), end = fx.endDate && fx.endDate < toISO ? fx.endDate : toISO;
  const from = fromISO > start ? fromISO : start;
  if (end < from) return out;
  const s = dateOf(start);
  if (fx.frequency === 'week') {
    const days = Math.round((dateOf(from) - s) / 86400000);
    let iso = addDays(start, Math.ceil(Math.max(0, days) / 7) * 7);
    for (let n = 0; n < 1000 && iso <= end; n++) { out.push(iso); iso = addDays(iso, 7); }
    return out;
  }
  const step = { month: 1, quarter: 3, year: 12 }[fx.frequency] || 1, f = dateOf(from);
  const diff = (f.getFullYear() - s.getFullYear()) * 12 + (f.getMonth() - s.getMonth());
  for (let k = Math.max(0, Math.floor(diff / step) - 1), n = 0; n < 1000; k++, n++) {
    const m = s.getMonth() + k * step, y = s.getFullYear() + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
    const iso = isoOf(new Date(y, mm, Math.min(s.getDate(), new Date(y, mm + 1, 0).getDate()), 12));
    if (iso > end) break;
    if (iso >= from) out.push(iso);
  }
  return out;
}

export function paidKeyFor(fx, occ) {
  const p = toArr(fx.paidPeriods);
  if (p.indexOf(occ) >= 0) return occ;
  if (fx.frequency !== 'week' && p.indexOf(occ.slice(0, 7)) >= 0) return occ.slice(0, 7);
  if (fx.frequency === 'week') { const d = dateOf(occ), ws = addDays(occ, -((d.getDay() + 6) % 7)); if (p.indexOf(ws) >= 0) return ws; }
  return null;
}

export function kyivToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const KIND = { income: 'надходження', contribution: 'внесок на картку' };

// Нагадування для одного пристрою: спільне + особисте того, чий це пристрій
export function messageFor(data, owner, today) {
  const cur = (data.settings && data.settings.currency) || '₴';
  const money = n => Math.round(n).toLocaleString('uk-UA') + ' ' + cur;
  const tomorrow = addDays(today, 1), lines = [];
  let overdue = 0;
  toArr(data.fixedExpenses).forEach(fx => {
    if (fx.scope && fx.scope !== 'shared' && fx.scope !== owner) return;
    fxOccurrences(fx, addDays(today, -7), tomorrow).forEach(o => {
      if (paidKeyFor(fx, o)) return;
      if (o < today) { overdue++; return; }
      const what = KIND[fx.kind] ? `${KIND[fx.kind]} «${fx.title}»` : fx.title;
      lines.push({ o, text: `${o === today ? 'Сьогодні' : 'Завтра'}: ${what} — ${money(fx.amount)}` });
    });
  });
  lines.sort((a, b) => a.o.localeCompare(b.o));
  if (!lines.length && !overdue) return null;
  const body = lines.slice(0, 4).map(l => l.text);
  if (lines.length > 4) body.push(`і ще ${lines.length - 4}`);
  if (overdue) body.push(`Непроведених за тиждень: ${overdue}`);
  const todayCount = lines.filter(l => l.o === today).length;
  return { title: todayCount ? 'UsBudget · платежі сьогодні' : 'UsBudget · нагадування', body: body.join('\n'), url: './#fixed', tag: 'usbudget-' + today };
}
