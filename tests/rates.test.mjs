import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNbu, parseGecko, parseYahoo, convert } from '../lib/rates.mjs';

const nbu = [{ cc: 'USD', rate: 40 }, { cc: 'EUR', rate: 44 }, { cc: 'XAU', rate: 100000 }, { cc: 'PLN', rate: 10 }];

test('НБУ: долар = 1, гривня = 1/40, метал позначений', () => {
  const t = parseNbu(nbu);
  assert.equal(t.USD.usd, 1);
  assert.equal(t.UAH.usd, 1 / 40);
  assert.equal(t.EUR.usd, 1.1);
  assert.equal(t.XAU.kind, 'metal');
  assert.deepEqual(parseNbu([{ cc: 'EUR', rate: 44 }]), {}); // без долара рахувати нічим
  assert.deepEqual(parseNbu(null), {});
});

test('конвертація: 1000 USD → 40000 UAH; 100 EUR → 110 USD; назад збігається', () => {
  const t = { ...parseNbu(nbu), ...parseGecko({ bitcoin: { usd: 50000 } }) };
  assert.equal(convert(1000, 'USD', 'UAH', t), 40000);
  assert.ok(Math.abs(convert(100, 'EUR', 'USD', t) - 110) < 1e-9);
  assert.ok(Math.abs(convert(0.5, 'BTC', 'UAH', t) - 1000000) < 1e-6); // 0.5×50000×40
  const there = convert(123.45, 'PLN', 'BTC', t);
  assert.ok(Math.abs(convert(there, 'BTC', 'PLN', t) - 123.45) < 1e-9);
  assert.equal(convert(1, 'USD', 'ZZZ', t), null);
});

test('CoinGecko і Yahoo: сміття відкидається', () => {
  assert.deepEqual(parseGecko({ bitcoin: { usd: 'x' } }), {});
  assert.equal(parseYahoo('AAPL', { chart: { result: [{ meta: { regularMarketPrice: 200, currency: 'USD' } }] } }).usd, 200);
  assert.equal(parseYahoo('X', { chart: { result: [{ meta: { regularMarketPrice: 5, currency: 'EUR' } }] } }), null);
  assert.equal(parseYahoo('X', {}), null);
});
