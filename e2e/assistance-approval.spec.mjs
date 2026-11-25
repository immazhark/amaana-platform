import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// The assistance queue brief, sections 7 to 9 and 13 items 13 to 17 and 24 to 25: an approver sees what each route needs before
// submitting, an approval that is not ready keeps the work and lists every problem, and one confirmation completes the
// verification and approves the request. Approval never publishes. Synthetic records only; the seed refuses every target
// except the disposable CI postgres/amaana database, so this runs there and nowhere else.
const isolated = process.env.CI === 'true';
let seed;

test.describe.configure({ mode: 'serial' });
test.skip(!isolated, 'Needs the disposable CI database fixture.');

test.beforeAll(() => {
  if (!isolated) return;
  seed = JSON.parse(execFileSync(process.execPath, ['scripts/seed-ui-route-audit.mjs'], {
    cwd: process.env.AMAANA_APP_WORKSPACE ?? process.cwd(),
    env: { ...process.env, AMAANA_UI_AUDIT_TARGET: 'isolated-ci', AMAANA_ASSISTANCE_APPROVAL_FIXTURES: 'true' },
    encoding: 'utf8',
  }));
  expect(seed.approveRequestId, 'private approval fixture must exist').toEqual(expect.any(String));
  expect(seed.approvePublicRequestId, 'public approval fixture must exist').toEqual(expect.any(String));
});

async function open(page, requestId) {
  await page.context().addCookies([{ name: 'amaana_admin_session', value: seed.token, url: 'http://127.0.0.1:3000', httpOnly: true, sameSite: 'Strict' }]);
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(`/admin/requests/${requestId}`, { waitUntil: 'load' });
  expect(response?.ok()).toBeTruthy();
  const card = page.locator('section:has(#review-heading)');
  await expect(card.getByRole('heading', { name: 'Review and decision' })).toBeVisible();
  return card;
}

const approve = card => card.getByRole('button', { name: 'Approve assistance' });
async function submitApproval(card, page) {
  await approve(card).click();
  const summary = page.getByRole('dialog', { name: 'Check answers before approval' });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Support route');
  await expect(page.locator('.status-badge').first()).toContainText('UNDER VERIFICATION');
  await summary.getByRole('button', { name: 'Confirm approval', exact: true }).click();
}

async function fillCore(page) {
  await page.locator('#needConfirmed').check();
  await page.locator('#evidenceReviewed').check();
  await page.locator('#otherFundingChecked').check();
  await page.locator('#verifiedNeedAmount').fill('5000');
  await page.locator('#paymentDestination').fill('Synthetic hospital billing desk');
  await page.locator('#verificationSummary').fill('Synthetic summary of what was checked.');
  await page.locator('#zakatStatus').selectOption('NOT_APPLICABLE');
}

test('what each route needs is visible before anything is submitted', async ({ page }) => {
  const card = await open(page, seed.approveRequestId);
  await expect(card.getByText('Partial funding and public visibility are different things')).toBeVisible();
  await expect(card.getByText('Approval never publishes it')).toBeVisible();
  await expect(card.getByText('Required to approve').first()).toBeVisible();
  await expect(card.getByText('Required for public fundraising only').first()).toBeVisible();
  await expect(card.getByRole('button', { name: 'Save review progress' })).toBeVisible();
  const followUp = page.locator('section:has(#request-more-heading)');
  await expect(followUp.getByRole('heading', { name: 'Request additional information' })).toBeVisible();
  await expect(followUp.getByLabel(/Specific missing items or questions/i)).toBeVisible();
  await expect(followUp.locator('input[name="status"]')).toHaveValue('DOCUMENTS_REQUESTED');
  await expect(followUp).toContainText('No applicant upload or reply portal is available');
  await expect(page.getByRole('heading', { name: 'Review workflow guide' })).toBeVisible();

  await expect(approve(card)).toBeVisible();
  // The old controls are gone: no completion checkbox, and no APPROVED or REJECTED to pick as a status.
  await expect(card.locator('input[name="markComplete"]')).toHaveCount(0);
  const statuses = await page.locator('#status').locator('option').evaluateAll(nodes => nodes.map(node => node.value));
  expect(statuses).not.toContain('APPROVED');
  expect(statuses).not.toContain('REJECTED');
  await approve(card).click();
  const checkAnswers = page.getByRole('dialog', { name: 'Check answers before approval' });
  await expect(checkAnswers).toContainText('Support route');
  await expect(checkAnswers).toContainText('Not decided yet');
  await checkAnswers.getByRole('button', { name: 'Back to edit' }).click();
  await expect(checkAnswers).not.toBeVisible();
  await expect(page.locator('.status-badge').first()).toContainText('UNDER VERIFICATION');
});

test('an approval that is not ready lists every problem together, keeps the work and changes nothing', async ({ page }) => {
  const card = await open(page, seed.approveRequestId);
  await page.locator('#needConfirmed').check();
  await page.locator('#verificationSummary').fill('Half written summary kept as progress');
  await submitApproval(card, page);

  const summary = page.locator('#approval-inline-errors');
  await expect(summary).toBeVisible();
  await expect(summary).toHaveAttribute('role', 'alert');
  for (const text of ['Supporting evidence must be reviewed.', 'Verified need amount must be recorded.', 'Payment destination must be confirmed.', 'Other funding or duplicate fundraising must be checked.', 'Zakat review must be recorded', 'Choose how this request is to be supported', 'Confirm the approval to continue.']) {
    await expect(summary.getByRole('link', { name: new RegExp(text) })).toBeVisible();
  }
  await expect(summary).toContainText('Nothing has been approved. Your work has been saved as review progress.');
  await expect(page.locator('#evidenceReviewed')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#evidenceReviewed')).toHaveAttribute('aria-describedby', /evidenceReviewed-inline-error/);
  await expect(page.locator('#evidenceReviewed-inline-error')).toBeVisible();
  await expect(page.locator('#confirmApproval')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#needConfirmed')).not.toHaveAttribute('aria-invalid', 'true');

  // What was entered survived as saved progress, and nothing was decided.
  await expect(page.locator('#needConfirmed')).toBeChecked();
  await expect(page.locator('#verificationSummary')).toHaveValue('Half written summary kept as progress');
  await expect(page.locator('.status-badge').first()).toContainText('UNDER VERIFICATION');

  // A summary link goes to its field.
  await summary.getByRole('link', { name: /Supporting evidence must be reviewed/ }).click();
  await expect(page).toHaveURL(/#evidenceReviewed$/);
});

test('one confirmation completes the verification and approves a private case, and creates no appeal', async ({ page }) => {
  const card = await open(page, seed.approveRequestId);
  await expect(page.locator('#verificationSummary')).toHaveValue('Half written summary kept as progress');
  await fillCore(page);
  await page.locator('#decision').selectOption('APPROVED_PRIVATE');
  await page.locator('#confirmApproval').check();
  await submitApproval(card, page);

  const banner = page.locator('#approve-heading');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Request approved');
  await expect(banner).toContainText('is now Approved as private assistance');
  await expect(banner).toContainText('No public appeal is created.');
  await expect(banner).toContainText('Approved does not mean funds have been paid.');
  await expect(page.locator('.status-badge').first()).toContainText('APPROVED');
  await expect(approve(card)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Create draft appeal' })).toHaveCount(0);
  await expect(card).toContainText('Completed');
});

test('public approval never publishes: it only makes the draft appeal available', async ({ page }) => {
  const card = await open(page, seed.approvePublicRequestId);
  await fillCore(page);
  await page.locator('#decision').selectOption('APPROVED_PUBLIC');
  await page.locator('#approvedPublicTarget').fill('4500');

  // Public fundraising also needs every disclosure permission decided: leaving them unconfirmed is stopped, naming each.
  await page.locator('#confirmApproval').check();
  await submitApproval(card, page);
  const summary = page.locator('#approval-inline-errors');
  await expect(summary.getByRole('link', { name: /Public-name consent must be resolved/ })).toBeVisible();
  await expect(summary.getByRole('link', { name: /Public archive consent must be resolved/ })).toBeVisible();
  await expect(page.locator('.status-badge').first()).toContainText('UNDER VERIFICATION');

  for (const [id, answer] of [['publicNameConsent', 'NOT_ALLOWED'], ['photoConsent', 'NOT_APPLICABLE'], ['medicalDetailsConsent', 'ALLOWED'], ['institutionNameConsent', 'NOT_ALLOWED'], ['archiveConsent', 'ALLOWED']]) {
    await page.locator(`#${id}`).selectOption(answer);
  }
  await page.locator('#confirmApproval').check();
  await submitApproval(card, page);

  const banner = page.locator('#approve-heading');
  await expect(banner).toContainText('as public fundraising');
  await expect(banner).toContainText('Nothing has been published');
  await expect(page.locator('.status-badge').first()).toContainText('APPROVED');
  // The existing, separate next step: appeal preparation. Approval did not create or publish an appeal.
  await expect(page.getByRole('heading', { name: 'Create draft appeal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Linked appeal' })).toHaveCount(0);
});

// Phone width, keyboard and 200% text zoom for the untouched audited request, with this form on it, are covered by the page
// audit (e2e/all-page-audit.spec.mjs: mobile and desktop, overflow, text resizing and serious accessibility violations).


test('a conflicting approval keeps entered work and does not overwrite the newer review', async ({ page, context }) => {
  const card = await open(page, seed.staleApproveRequestId);
  await fillCore(page);
  await page.locator('#verificationSummary').fill('Unsaved original review text');
  await page.locator('#decision').selectOption('APPROVED_PRIVATE');
  await page.locator('#confirmApproval').check();
  const newer = await context.newPage();
  try {
    const other = await open(newer, seed.staleApproveRequestId);
    await newer.locator('#verificationSummary').fill('Newer saved review text');
    await newer.locator('#decision').selectOption('REFERRED');
    await other.getByRole('button', { name: 'Save review progress' }).click();
    await expect(other.getByRole('status').filter({ hasText: /^Review progress saved\. No decision has been made\.$/ })).toBeVisible();
    await submitApproval(card, page);
    await expect(page.locator('#approval-inline-errors')).toContainText('review changed');
    await expect(page.locator('#verificationSummary')).toHaveValue('Unsaved original review text');
    await expect(page.locator('#decision')).toHaveValue('APPROVED_PRIVATE');
    await expect(page.locator('.status-badge').first()).toContainText('UNDER VERIFICATION');
    await newer.reload();
    await expect(newer.locator('#verificationSummary')).toHaveValue('Newer saved review text');
    await expect(newer.locator('#decision')).toHaveValue('REFERRED');
  } finally { await newer.close(); }
});
