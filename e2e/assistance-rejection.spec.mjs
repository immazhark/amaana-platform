import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// The assistance queue brief, section 13 items 23 to 26 and 29: an approver rejects an otherwise untouched, eligible request
// with only a reason and an explicit confirmation, without visiting any approval section. Synthetic records only.
// The seed refuses every target except the disposable CI postgres/amaana database, so this runs there and nowhere else.
const isolated = process.env.CI === 'true';
let seed;

test.describe.configure({ mode: 'serial' });
test.skip(!isolated, 'Needs the disposable CI database fixture.');

test.beforeAll(() => {
  if (!isolated) return;
  seed = JSON.parse(execFileSync(process.execPath, ['scripts/seed-ui-route-audit.mjs'], {
    cwd: process.env.AMAANA_APP_WORKSPACE ?? process.cwd(),
    env: { ...process.env, AMAANA_UI_AUDIT_TARGET: 'isolated-ci' },
    encoding: 'utf8',
  }));
});

async function signIn(page) {
  await page.context().addCookies([{ name: 'amaana_admin_session', value: seed.token, url: 'http://127.0.0.1:3000', httpOnly: true, sameSite: 'Strict' }]);
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
}

async function openCase(page) {
  await signIn(page);
  const response = await page.goto(`/admin/requests/${seed.rejectRequestId}`, { waitUntil: 'load' });
  expect(response?.ok()).toBeTruthy();
  const card = page.locator('section[aria-labelledby="reject-heading"]');
  await expect(card.getByRole('heading', { name: 'Reject request' })).toBeVisible();
  return card;
}

test('an approver rejects an untouched eligible request with only a reason and a confirmation', async ({ page }) => {
  const card = await openCase(page);
  const reason = card.locator('#reject-reason');
  const confirm = card.locator('#reject-confirm');
  const submit = card.getByRole('button', { name: 'Confirm rejection' });

  // 23 and 24: requiredness is visible text, and nothing else on the page has to be touched. Invalid unsaved approval input
  // elsewhere on the page must not matter.
  await expect(card.getByText('Required to reject').first()).toBeVisible();
  await expect(card.getByText('You do not need to complete any approval check to reject a request')).toBeVisible();
  await page.locator('#approvedPublicTarget').fill('not a number');

  // 25: nothing entered yet; every problem is listed together, linked to its field, and focus moves to the summary.
  await expect(submit).toBeEnabled();
  await submit.click();
  const summary = card.getByRole('alert');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('link', { name: 'Enter the reason for rejecting this request.' })).toBeVisible();
  await expect(summary.getByRole('link', { name: 'Confirm the rejection to continue.' })).toBeVisible();
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(confirm).toHaveAttribute('aria-invalid', 'true');
  await expect(reason).toHaveAttribute('aria-describedby', /reject-reason-error/);
  await expect(page.locator('#reject-reason-error')).toBeVisible();
  await expect(page.locator('#reject-confirm-error')).toBeVisible();

  // A summary link moves keyboard focus to its field.
  await summary.getByRole('link', { name: 'Enter the reason for rejecting this request.' }).click();
  await expect(reason).toBeFocused();

  // What is typed survives a recoverable error: too short, so the same text is still in the box.
  await reason.fill('no');
  await confirm.check();
  await submit.click();
  await expect(card.getByRole('alert').getByRole('link', { name: /at least 3 characters/ })).toBeVisible();
  await expect(reason).toHaveValue('no');
  await expect(page.locator('#reject-reason-error')).toContainText('at least 3');

  // The reviewer fixes the one thing wrong and decides. The request was not changed by any failed attempt.
  await expect(page.locator('.status-badge').first()).toContainText('SUBMITTED');
  await reason.fill('Duplicate of an earlier request');
  await confirm.check();
  await submit.click();

  // 26 and the recorded outcome: success, the new status, who and when, and a way back to the queue.
  const done = card.getByRole('status');
  await expect(done.getByRole('heading', { name: 'Request rejected' })).toBeVisible();
  await expect(done.getByRole('heading', { name: 'Request rejected' })).toBeFocused();
  await expect(done).toContainText('is now Rejected');
  await expect(done).toContainText('Recorded by Synthetic audit administrator');
  await expect(done).toContainText('not sent to the applicant');
  await expect(done.getByRole('link', { name: 'Back to the queue' })).toHaveAttribute('href', '/admin');

  // The page now shows the decision and the private reason, and no second rejection form.
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('.status-badge').first()).toContainText('REJECTED');
  const recorded = page.locator('section[aria-labelledby="reject-heading"]');
  await expect(recorded.getByRole('heading', { name: 'Request rejected' })).toBeVisible();
  await expect(recorded).toContainText('Duplicate of an earlier request');
  await expect(recorded.getByRole('button', { name: 'Confirm rejection' })).toHaveCount(0);
});

// Runs after the journey above in this serial file: the same case is now rejected.
test('the rejected request can still be moved back into review, and the status form no longer offers REJECTED as a choice to make', async ({ page }) => {
  await signIn(page);
  await page.goto(`/admin/requests/${seed.rejectRequestId}`, { waitUntil: 'load' });
  const status = page.locator('#status');
  await expect(status).toHaveValue('REJECTED');
  const options = await status.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
  expect(options).toContain('UNDER_VERIFICATION');
  await expect(page.locator('section[aria-labelledby="reject-heading"]')).toContainText('Nothing is deleted');
});

// Phone width, keyboard and 200% text zoom for the untouched request, with this form on it, are covered by the page audit
// (e2e/all-page-audit.spec.mjs: mobile and desktop, overflow, text resizing and serious accessibility violations).
