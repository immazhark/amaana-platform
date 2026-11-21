import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const paths = ['stories', 'our-work', 'impact', 'appeals', 'faith-and-reflections'];
const read = file => readFileSync(join(root, file), 'utf8');

test('each public discovery route has a server loading fallback with a fixed route identity', () => {
  for (const route of paths) {
    const path = `src/app/${route}/(overview)/loading.tsx`;
    assert.ok(existsSync(join(root, `src/app/${route}/(overview)/page.tsx`)),
      `${route} needs a matching overview page to scope streaming`);
    assert.ok(!existsSync(join(root, `src/app/${route}/loading.tsx`)),
      `${route} must not stream nested redirects or missing child routes`);
    assert.ok(existsSync(join(root, path)), `${route} is missing its loading.tsx`);
    const source = read(path);
    assert.match(source, /import \{ PublicRouteLoading \} from ['"]@\/components\/public-route-loading['"]/);
    assert.ok(source.includes(`route="${route}"`), `${route} has the wrong route identity`);
    assert.doesNotMatch(source, /use client|fetch\(|prisma\.|searchParams|window\./);
  }
});

test('AF-R071 comparison route streams an accurate and nontransactional loading boundary', () => {
  const path = 'src/app/impact/compare/loading.tsx';
  assert.ok(existsSync(join(root, path)), 'Dynamic impact comparison needs its own loading boundary');
  const source = read(path);
  assert.match(source, /import \{ PublicRouteLoading \} from ['"]@\/components\/public-route-loading['"]/);
  assert.match(source, /route="impact-compare"/);
  assert.doesNotMatch(source, /use client|fetch\(|prisma\.|searchParams|window\./);
  const component = read('src/components/public-route-loading.tsx');
  assert.match(component, /"impact-compare":\s*\{\s*title:\s*"Compare Documented Impact"/);
  assert.match(component, /Loading published initiatives to compare/);
});

test('loading component is accessible, noninteractive, and never renders invented public evidence', () => {
  const source = read('src/components/public-route-loading.tsx');
  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-hidden="true"/);
  // The streamed fallback stays in the served HTML beside the real page, so it must not add a second h1
  // (#1060, #1066). The title is a labelled paragraph; the real page owns the single h1.
  assert.doesNotMatch(source, /<h1\b/);
  // e2e/helpers/public-overview-ready.mjs waits for this exact id to disappear, so it is part of the contract.
  assert.match(source, /aria-labelledby="public-route-loading-title"/);
  assert.match(source, /<p\b[^>]*id="public-route-loading-title"/);
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

// A root page.tsx next to a (group)/page.tsx resolves to the same URL. Next.js does not fail the build; one file
// silently wins and the other is dead code that unit tests still exercise. This had left four public overview
// routes serving a stale root copy (no streaming boundary, and for /stories without the #886 fail-closed fix).
function pageFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return /^page\.(?:tsx|ts|jsx|js)$/.test(entry.name) ? [path] : [];
  });
}

/** Directory segments of a page file -> the URL path it serves, or null for slots and intercepting routes. */
export function resolvePageUrl(segments) {
  if (segments.some(segment => segment.startsWith('@') || /^\(\.+\)/.test(segment))) return null;
  return '/' + segments.filter(segment => !/^\(.*\)$/.test(segment)).join('/');
}

test('page URL resolution ignores route groups and skips parallel or intercepting routes', () => {
  assert.equal(resolvePageUrl(['appeals', '(overview)']), '/appeals');
  assert.equal(resolvePageUrl(['appeals']), '/appeals');
  assert.equal(resolvePageUrl(['admin', '(protected)', 'funds']), '/admin/funds');
  assert.equal(resolvePageUrl(['appeals', '[slug]']), '/appeals/[slug]');
  assert.equal(resolvePageUrl([]), '/');
  assert.equal(resolvePageUrl(['feed', '@modal']), null);
  assert.equal(resolvePageUrl(['feed', '(.)photo']), null);
});

test('no two page files resolve to the same URL', () => {
  const appRoot = join(root, 'src/app');
  const byUrl = new Map();
  for (const file of pageFiles(appRoot)) {
    const url = resolvePageUrl(relative(appRoot, file).split(sep).slice(0, -1));
    if (url === null) continue;
    byUrl.set(url, [...(byUrl.get(url) ?? []), relative(root, file).split(sep).join('/')]);
  }
  const duplicates = [...byUrl].filter(([, files]) => files.length > 1).map(([url, files]) => url + ': ' + files.join(' and '));
  assert.deepEqual(duplicates, []);
});
