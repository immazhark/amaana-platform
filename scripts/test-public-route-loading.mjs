import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const paths = ['stories', 'our-work', 'impact', 'appeals', 'faith-and-reflections'];
const read = file => readFileSync(join(root, file), 'utf8');

test('each public discovery route has a server loading fallback with a fixed route identity', () => {
  for (const route of paths) {
    const path = `src/app/${route}/loading.tsx`;
    assert.ok(existsSync(join(root, path)), `${route} is missing its loading.tsx`);
    const source = read(path);
    assert.match(source, /import \{ PublicRouteLoading \} from ['"]@\/components\/public-route-loading['"]/);
    assert.ok(source.includes(`route="${route}"`), `${route} has the wrong route identity`);
    assert.doesNotMatch(source, /use client|fetch\(|prisma\.|searchParams|window\./);
  }
});

test('loading component is accessible, noninteractive, and never renders invented public evidence', () => {
  const source = read('src/components/public-route-loading.tsx');
  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /<h1\b/);
  assert.doesNotMatch(source, /<main\b|<button\b|<a\b|<img\b|<video\b|fetch\(|prisma\.|Math\.random|Date\(/);
  for (const route of paths) assert.ok(source.includes(`"${route}"`), `Missing copy for ${route}`);
});

test('branded placeholders are responsive and do not animate when reduced motion is requested', () => {
  const css = read('src/components/public-route-loading.module.css');
  assert.match(css, /var\(--af-color-canvas\)/);
  assert.match(css, /var\(--af-color-blue-600\)/);
  assert.ok(css.includes('calc(100% - var(--af-public-gutter) - var(--af-public-gutter))'), 'Use widely supported calc subtraction instead of CSS multiplication');
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation:\s*none/);
});
