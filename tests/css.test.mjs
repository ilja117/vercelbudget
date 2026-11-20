// npm test: public/tw.css зібрано з поточного index.html (інакше нові класи Tailwind не матимуть стилів). Виправлення: npm run css
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const bin = join(root, 'node_modules/.bin/tailwindcss');

test('public/tw.css свіжий (npm run css)', { skip: !existsSync(bin) && 'tailwindcss не встановлено (npm i)' }, () => {
  const out = join(mkdtempSync(join(tmpdir(), 'tw-')), 'tw.css');
  execFileSync(bin, ['-c', 'tailwind.config.cjs', '-i', 'tailwind.in.css', '-o', out, '--minify'], { cwd: root, stdio: 'ignore' });
  assert.ok(readFileSync(out, 'utf8') === readFileSync(join(root, 'public/tw.css'), 'utf8'), 'public/tw.css застарів — запустіть npm run css');
});

test('index.html підключає tw.css і не тягне Tailwind з CDN', () => {
  const html = readFileSync(join(root, 'public/index.html'), 'utf8');
  assert.match(html, /<link rel="stylesheet" href="tw.css">/);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
});
