import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// Actual authenticated server-rendered routes, not a replica UI.
// The existing seed refuses all but the disposable CI PostgreSQL target.
const isolated = process.env.CI === 'true';
let seed;
test.skip(!isolated, 'Requires the disposable CI database fixture.');
test.beforeAll(() => {
  if (!isolated) return;
  seed = JSON.parse(execFileSync(process.execPath, ['scripts/seed-ui-route-audit.mjs'], {
    cwd: process.env.AMAANA_APP_WORKSPACE ?? process.cwd(),
    env: { ...process.env, AMAANA_UI_AUDIT_TARGET: 'isolated-ci', AMAANA_OPERATIONAL_WORKBENCH_FIXTURES: 'true' },
    encoding: 'utf8',
  }));
  expect(seed.workbenchRequestId).toEqual(expect.any(String));
});

async function open(page, route) {
  await page.context().addCookies([{ name: 'amaana_admin_session', value: seed.token, url: 'http://127.0.0.1:3000', httpOnly: true, sameSite: 'Strict' }]);
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response?.ok()).toBeTruthy();
}

test('Taleem filters intersect and clear without changing the whole-roster reconciliation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/admin/taleem');
  const counts = page.locator('section[aria-labelledby="counts-heading"]');
  const before = await counts.innerText();
  const current = page.locator('#learner-TL-WKBNCHAA');
  const other = page.locator('#learner-TL-WKBNCHAB');
  await expect(current).toBeVisible();
  await expect(other).toBeVisible();
  const form = page.getByRole('form', { name: 'Filter private learner records' });
  await form.getByLabel('Programme').selectOption('NAZIRA');
  await form.getByLabel('Learner status').selectOption('ACTIVE');
  await form.getByLabel('Place assignment').selectOption('CURRENT');
  await form.getByRole('button', { name: 'Apply learner filters' }).click();
  await expect(page).toHaveURL(/programmeFilter=NAZIRA/);
  await expect(current).toBeVisible();
  await expect(other).toHaveCount(0);
  await expect(counts).toHaveText(before, { useInnerText: true });
  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect(other).toBeVisible();
  await expect(counts).toHaveText(before, { useInnerText: true });
});

test('case history traverses equal timestamps without overlap and preserves queue context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/admin/requests/'+encodeURIComponent(seed.workbenchRequestId)+'?queueStatus=UNDER_VERIFICATION&queuePage=2');
  const sections = page.getByRole('navigation', { name: 'Case review sections' });
  await sections.getByRole('link', { name: 'Recorded changes' }).click();
  await expect(page).toHaveURL(/#audit-history-heading$/);
  const history = page.locator('section:has(#audit-history-heading)');
  await expect(history.locator('ol.history > li')).toHaveCount(50);
  await expect(history.locator('ol.history > li').first()).toContainText('workbench change 51');
  await expect(history.locator('ol.history > li').last()).toContainText('workbench change 02');
  await history.getByRole('link', { name: 'Older changes' }).click();
  await expect(page).toHaveURL(/historyBefore=/);
  await expect(history.locator('ol.history > li')).toHaveCount(1);
  await expect(history.locator('ol.history > li').first()).toContainText('workbench change 01');
  await expect(history.getByRole('link', { name: 'Older changes' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Return to assistance queue' })).toHaveAttribute('href', '/admin?status=UNDER_VERIFICATION&page=2');
  await history.getByRole('link', { name: 'Newest changes' }).click();
  await expect(history.locator('ol.history > li')).toHaveCount(50);
  await expect(page.getByRole('heading', { name: 'Review and decision' })).toBeVisible();
});

test('financial-year control totals reconcile rendered destination rows and keep exports aggregate-only', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, '/admin/funds');
  const region = page.getByRole('region', { name: 'Financial-year reconciliation review', exact: true });
  await expect(region).toBeVisible();
  const totals = await region.evaluate(node => {
    const parse = (text, count) => {
      if (text.trim() === '—') return 0;
      const value = text.replace(/[₹,\s]/g,'');
      if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Unexpected aggregate cell');
      if (count) return Number(value);
      const [whole, fraction=''] = value.split('.');
      return Number(whole)*100+Number(fraction.padEnd(2,'0'));
    };
    const cells = row => [...row.querySelectorAll('td')].map((cell,index)=>parse(cell.textContent ?? '',index===3));
    const rows = [...node.querySelectorAll('tbody tr')].map(cells);
    const footer = cells(node.querySelector('tfoot tr'));
    return {rows:rows.length, sum:rows.reduce((sum,row)=>sum.map((value,index)=>value+row[index]),Array(7).fill(0)), footer};
  });
  expect(totals.rows).toBeGreaterThan(0);
  expect(totals.footer).toEqual(totals.sum);
  expect(totals.footer[4]).toBeGreaterThanOrEqual(10000);
  const csv = await page.getByRole('link', { name: 'Download aggregate CSV for review' }).getAttribute('href');
  expect(csv).toMatch(/^data:text\/csv;charset=utf-8,/);
  const decoded = decodeURIComponent(csv.split(',').slice(1).join(','));
  expect(decoded).toContain('pending_claims_created_inr');
  expect(decoded).not.toMatch(/donorEmail|donorName|ui-audit@example\.invalid|Synthetic donor/);
});

test('donation reviewer returns to the same filtered queue', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/admin/donations?status=PENDING_VERIFICATION&method=DIRECT_UPI&sort=oldest');
  const records = page.getByRole('region', { name: 'Donation records', exact: true });
  await records.getByRole('link', { name: 'AFD-UI-AUDIT', exact: true }).click();
  await expect(page).toHaveURL(/queueStatus=PENDING_VERIFICATION/);
  await expect(page.getByRole('heading', { name: 'Reconcile transfer' })).toBeVisible();
  const back = page.getByRole('link', { name: 'Return to donation queue' });
  await expect(back).toHaveAttribute('href', '/admin/donations?status=PENDING_VERIFICATION&method=DIRECT_UPI&sort=oldest');
  await back.click();
  await expect(records.getByRole('link', { name: 'AFD-UI-AUDIT', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Donation ordering' }).getByRole('link', { name: 'Oldest first' })).toHaveAttribute('aria-current', 'page');
});
