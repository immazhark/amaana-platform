import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Execute only the repository's synthetic vitals test section with controlled
// observers. No browser, application server, network or donor data is involved.
const source = readFileSync(new URL('../e2e/public-performance.spec.mjs', import.meta.url), 'utf8');
const start = source.indexOf('const webVitalRoutes = ');
const end = source.indexOf("test('critical public routes do not load Razorpay", start);
assert.ok(start >= 0 && end > start, 'Synthetic vitals test section must exist');
const section = source.slice(start, end);

async function run(entries, lcp = 400) {
  const observers = new Map();
  const logs = [];
  const tests = [];
  const context = {
    window: {},
    PerformanceObserver: class {
      constructor(callback) { this.callback = callback; }
      observe({ type, buffered }) {
        assert.equal(buffered, true);
        observers.set(type, this.callback);
      }
    },
    test: (name, fn) => tests.push({ name, fn }),
    expect: (value, message) => ({
      toBeTruthy: () => assert.ok(value, message),
      toBeGreaterThan: limit => assert.ok(value > limit, message),
      toBeLessThanOrEqual: limit => assert.ok(value <= limit, message),
    }),
    console: { log: line => logs.push(line) },
  };
  runInNewContext(section, context);
  const home = tests.find(item => item.name.startsWith('/ stays within '));
  assert.ok(home, 'Homepage vitals test must exist');
  const page = {
    addInitScript: async fn => runInNewContext(`(${fn.toString()})()`, context),
    route: async () => {},
    goto: async () => ({ ok: () => true }),
    waitForTimeout: async ms => {
      assert.equal(ms, 750);
      observers.get('largest-contentful-paint')({ getEntries: () => [{ startTime: lcp }] });
      for (const batch of [entries.slice(0, 3), entries.slice(3)]) {
        observers.get('longtask')({ getEntries: () => batch });
      }
    },
    evaluate: async fn => runInNewContext(`(${fn.toString()})()`, context),
  };
  let error = null;
  try { await home.fn({ page }); } catch (caught) { error = caught; }
  const prefix = 'Synthetic long tasks /: ';
  const line = logs.find(value => value.startsWith(prefix));
  return {
    error,
    diagnostic: line ? JSON.parse(line.slice(prefix.length)) : null,
    blocking: context.window.__amaanaBlockingTime,
    routeCount: tests.length,
  };
}

const task = (duration, startTime = 100) => ({
  duration, startTime, attribution: [{ containerSrc: 'https://private.invalid/?token=synthetic' }],
});

test('exact 200ms boundary passes without a diagnostic', async () => {
  const result = await run([task(250)]);
  assert.equal(result.error, null);
  assert.equal(result.blocking, 200);
  assert.equal(result.diagnostic, null);
  assert.equal(result.routeCount, 8);
});

test('201ms fails and emits the count and longest timing', async () => {
  const result = await run([task(251)]);
  assert.match(result.error?.message ?? '', /200ms/);
  assert.equal(result.blocking, 201);
  assert.deepEqual(result.diagnostic, { count: 1, longest: [{ startTime: 100, duration: 251 }] });
});

test('only the eight longest samples are retained across observer batches', async () => {
  const entries = Array.from({ length: 12 }, (_, index) => task(55 + 10 * index, index * 200));
  const result = await run(entries);
  assert.match(result.error?.message ?? '', /200ms/);
  assert.equal(result.diagnostic?.count, 12);
  assert.deepEqual(result.diagnostic.longest.map(entry => entry.duration), [165, 155, 145, 135, 125, 115, 105, 95]);
  assert.equal(result.blocking, 720);
});

test('diagnostic excludes raw attribution and URLs', async () => {
  const result = await run([task(260)]);
  assert.ok(result.diagnostic);
  assert.doesNotMatch(JSON.stringify(result.diagnostic), /private|token|attribution/);
  assert.deepEqual(Object.keys(result.diagnostic.longest[0]).sort(), ['duration', 'startTime']);
});

test('LCP limit still fails without claiming a blocking-time failure', async () => {
  const result = await run([task(55)], 2501);
  assert.match(result.error?.message ?? '', /2.5s/);
  assert.equal(result.diagnostic, null);
  assert.equal(result.blocking, 5);
});

test('subthreshold entries contribute no blocking time', async () => {
  const result = await run([task(35), task(50), task(60)]);
  assert.equal(result.blocking, 10);
  assert.equal(result.error, null);
  assert.equal(result.diagnostic, null);
});
