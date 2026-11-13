// npm test: формула боргу з public/index.html
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const grab = re => { const m = src.match(re); assert.ok(m, String(re)); return m[0]; };
const code = [
  grab(/const clampPct = .*\n/),
  grab(/function v4Balance\(st\) \{[\s\S]*?\n    \}\n/),
  grab(/function v4Settle\(b\) \{[\s\S]*?\n    \}\n/),
  grab(/function v4Includer\(st\) \{[\s\S]*?\n    \}\n/),
].join('\n');
const { v4Balance, v4Settle } = new Function(code + '; return { v4Balance, v4Settle };')();

const base = (o = {}) => ({ settings: { modelStart: '2026-01-01', p1Pct: 50, cardStart: 0 }, contributions: [], expenses: [], personalExpenses: [], settlements: [], ...o });
const ct = (from, amount) => ({ date: '2026-02-01', from, amount });
const ex = (payer, amount) => ({ date: '2026-02-02', payer, amount });

test('картка витрачена повністю: як різниця внесків', () => {
  const s = v4Settle(v4Balance(base({ contributions: [ct('p1', 80), ct('p2', 20)], expenses: [ex('card', 100)] })));
  assert.equal(s.debtor, 'p2'); assert.equal(s.toPartner, 30);
});

test('невитрачені гроші на картці боргу не створюють', () => {
  const s = v4Settle(v4Balance(base({ contributions: [ct('p1', 5000), ct('p2', 3000)], expenses: [ex('card', 4000)] })));
  assert.equal(s.debtor, 'p2'); assert.equal(s.toPartner, 500);
  assert.equal(v4Settle(v4Balance(base({ contributions: [ct('p1', 5000), ct('p2', 3000)] }))).debtor, null);
});

test('витрата зі своєї картки: партнер винен свою частку', () => {
  const s = v4Settle(v4Balance(base({ expenses: [ex('p1', 1000)] })));
  assert.equal(s.debtor, 'p2'); assert.equal(s.toPartner, 500);
});

test('особисте з картки лягає на власника', () => {
  const b = v4Balance(base({ contributions: [ct('p1', 100), ct('p2', 100)], personalExpenses: [{ date: '2026-02-03', owner: 'p1', amount: 100, fromCard: true }] }));
  const s = v4Settle(b);
  assert.equal(s.debtor, 'p1'); assert.equal(s.toPartner, 50);
});

test('кінцева частка і перекази', () => {
  const st = base({ expenses: [ex('p1', 1000)], settlements: [{ date: '2026-02-05', from: 'p2', to: 'p1', amount: 500 }] });
  assert.equal(v4Settle(v4Balance(st)).debtor, null);
  st.settings.p1Pct = 70; st.settlements = [];
  const s = v4Settle(v4Balance(st)); assert.equal(s.debtor, 'p2'); assert.equal(s.toPartner, 300);
});

test('сума заплаченого дорівнює спільним витратам, початок до облікової дати ігнорується', () => {
  const b = v4Balance(base({ contributions: [ct('p1', 300), ct('p2', 100)], expenses: [ex('card', 200), ex('p2', 50), { date: '2025-12-01', payer: 'p1', amount: 999 }], settings: { modelStart: '2026-01-01', p1Pct: 50, cardStart: 100 } }));
  assert.ok(Math.abs(b.T - 250) < 1e-9);
});
