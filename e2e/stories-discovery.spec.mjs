import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

const programme = 'Synthetic discovery programme';
const hiddenProgramme = 'Synthetic unpublished discovery programme';
const fixturePrefix = 'synthetic-story-discovery-';
const isolatedFixtures = process.env.CI === 'true';

// The seed refuses every target except the disposable CI postgres/amaana DB.
// Never replace that refusal with a staging/production target or broad catch.
test.beforeAll(() => {
  if (!isolatedFixtures) return;
  execFileSync(process.execPath, ['scripts/seed-ui-route-audit.mjs'], {
    cwd: process.env.AMAANA_APP_WORKSPACE ?? process.cwd(),
    env: { ...process.env, AMAANA_UI_AUDIT_TARGET: 'isolated-ci', AMAANA_STORY_DISCOVERY_FIXTURES: 'true' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
});

async function openStories(page, path = '/stories') {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.ok()).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.getByRole('form', { name: 'Filter published stories' })).toBeVisible();
}

function resultLinks(page) {
  return page.locator('.v2-stories-feature-media, .v2-stories-grid > a');
}

function assertFixtureAvailability() {
  test.skip(!isolatedFixtures, 'Published synthetic pagination/context fixtures require the guarded disposable CI database.');
}

test('published story search and programme submit together and reset without stale form values', async ({ page }) => {
  assertFixtureAvailability();
  await openStories(page);
  await page.getByLabel('Search public stories', { exact: true }).fill('Synthetic discovery');
  await page.getByLabel('Programme', { exact: true }).selectOption(programme);
  await page.getByRole('button', { name: 'Find stories', exact: true }).click();
  await expect(page.getByLabel('Search public stories', { exact: true })).toHaveValue('Synthetic discovery');
  await expect(page.getByLabel('Programme', { exact: true })).toHaveValue(programme);
  const submitted = new URL(page.url());
  expect(submitted.searchParams.get('q')).toBe('Synthetic discovery');
  expect(submitted.searchParams.get('programme')).toBe(programme);
  await expect(page.getByText('14 published stories found.', { exact: true })).toBeVisible();
  await expect(resultLinks(page)).toHaveCount(12);
  await expect(page.getByText('Matching field note', { exact: true })).toBeVisible();
  const links = await resultLinks(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(links.every(href => href.startsWith('/stories/' + fixturePrefix))).toBeTruthy();
  await page.getByRole('link', { name: 'Clear story filters', exact: true }).click();
  await expect(page.getByLabel('Search public stories', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Programme', { exact: true })).toHaveValue('');
  expect(new URL(page.url()).search).toBe('');
});

test('story pagination retains filters and does not repeat the first-page lead', async ({ page }) => {
  assertFixtureAvailability();
  const params = new URLSearchParams({ q: 'Synthetic discovery', programme });
  await openStories(page, '/stories?' + params);
  const firstPage = await resultLinks(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(new Set(firstPage).size).toBe(12);
  await page.getByRole('navigation', { name: 'Story result pages' }).getByRole('link', { name: 'Next stories', exact: true }).click();
  await expect(page.getByText('Page 2 of 2', { exact: false })).toBeVisible();
  await expect(resultLinks(page)).toHaveCount(2);
  await expect(page.locator('.v2-stories-feature')).toHaveCount(0);
  const secondPage = await resultLinks(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(secondPage.some(href => firstPage.includes(href))).toBeFalsy();
  const location = new URL(page.url());
  expect(location.searchParams.get('q')).toBe('Synthetic discovery');
  expect(location.searchParams.get('programme')).toBe(programme);
  expect(location.searchParams.get('page')).toBe('2');
  await page.getByRole('link', { name: 'Previous stories', exact: true }).click();
  await expect(resultLinks(page)).toHaveCount(12);
  expect(await resultLinks(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(firstPage);
});

test('unpublished programme context and unpublished stories stay out of discovery', async ({ page }) => {
  assertFixtureAvailability();
  await openStories(page);
  await expect(page.getByLabel('Programme', { exact: true }).getByRole('option', { name: programme, exact: true })).toHaveCount(1);
  await expect(page.getByLabel('Programme', { exact: true }).getByRole('option', { name: hiddenProgramme, exact: true })).toHaveCount(0);
  await openStories(page, '/stories?q=' + encodeURIComponent('Synthetic unpublished discovery story'));
  await expect(page.getByRole('heading', { name: 'No published stories match these filters.', exact: true })).toBeVisible();
  await expect(resultLinks(page)).toHaveCount(0);
  await openStories(page, '/stories?programme=' + encodeURIComponent(hiddenProgramme));
  await expect(page.getByRole('status')).toContainText('These filters could not be read');
  await expect(page.getByLabel('Programme', { exact: true })).toHaveValue('');
});

for (const query of ['q=first&q=second', 'page=0', 'page=9007199254740992', 'unexpected=private-marker', 'q=' + 'x'.repeat(81)]) {
  test('invalid story query fails closed: ' + query.slice(0, 35), async ({ page }) => {
    await openStories(page, '/stories?' + query);
    await expect(page.getByRole('status')).toContainText('These filters could not be read');
    await expect(page.getByLabel('Search public stories', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Programme', { exact: true })).toHaveValue('');
    await expect(resultLinks(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No public stories are available yet.', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Clear story filters', exact: true }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByLabel('Search public stories', { exact: true })).toHaveValue('');
  });
}

for (const width of [320, 390, 1440]) {
  test('no-match recovery and search controls reflow at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openStories(page, '/stories?q=zz-no-published-story-matches-zz');
    await expect(page.getByRole('heading', { name: 'No published stories match these filters.', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No public stories are available yet.', exact: true })).toHaveCount(0);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    for (const control of [page.getByLabel('Search public stories', { exact: true }), page.getByLabel('Programme', { exact: true }), page.getByRole('button', { name: 'Find stories', exact: true })]) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    await page.getByRole('link', { name: 'Clear story filters', exact: true }).click();
    await expect(page.getByLabel('Search public stories', { exact: true })).toHaveValue('');
  });
}
