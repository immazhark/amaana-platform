import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Synthetic fixture only (/browser-acceptance/give-sponsorship). Razorpay and the order API are stubbed; no payment or
// donation is created. The production page is gated off, so this fixture is the browser check for the configurator.
const PAGE = '/browser-acceptance/give-sponsorship';

async function prepare(page) {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  await page.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: 'window.__checkoutOpens=0; window.Razorpay=class { constructor(options){this.options=options} open(){ window.__checkoutOpens++ } }',
  }));
}

const choose = async (page, { programme, months, extraUnits = 0 }) => {
  if (programme) await page.getByRole('radio', { name: programme }).check();
  if (months) await page.getByRole('radio', { name: months, exact: true }).check();
  for (let i = 0; i < extraUnits; i++) await page.getByRole('button', { name: 'More units' }).click();
};
const total = page => page.locator('#programme-total');
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('starts at one unit of Qaida for one month with the exact total', async ({ page }) => {
  await prepare(page);
  expect((await page.goto(PAGE)).ok()).toBe(true);
  await expect(page.getByRole('region', { name: 'Sponsor a Taleem programme.' })).toBeVisible();
  await expect(total(page)).toHaveText('1 unit × 1 month × ₹1,000 = ₹1,000');
  await expect(page.getByRole('button', { name: 'Give ₹1,000 to Qaida' })).toBeVisible();
});

test('programme, duration and units change the total exactly', async ({ page }) => {
  await prepare(page);
  await page.goto(PAGE);
  await choose(page, { programme: "Qur'an Nazira", months: '12 months', extraUnits: 2 });
  await expect(total(page)).toHaveText('3 units × 12 months × ₹1,200 = ₹43,200');
  await expect(page.getByRole('button', { name: "Give ₹43,200 to Qur'an Nazira" })).toBeVisible();
  await choose(page, { programme: 'Hifdh — Day Scholar', months: '6 months' });
  await expect(total(page)).toHaveText('3 units × 6 months × ₹1,500 = ₹27,000');
});

test('units stay between 1 and 50', async ({ page }) => {
  await prepare(page);
  await page.goto(PAGE);
  await expect(page.getByRole('button', { name: 'Fewer units' })).toBeDisabled();
  const units = page.getByLabel('Number of units');
  await units.fill('99');
  await units.blur();
  await expect(units).toHaveValue('50');
  await expect(page.getByRole('button', { name: 'More units' })).toBeDisabled();
  await expect(total(page)).toContainText('50 units');
});

test('the order carries programme, units, months and the quoted amount, and the amount cannot be edited', async ({ page }) => {
  await prepare(page);
  let body;
  await page.route('**/api/donations/order', route => {
    body = route.request().postDataJSON();
    return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic refusal' }) });
  });
  await page.goto(PAGE);
  await choose(page, { programme: "Qur'an Nazira", months: '12 months', extraUnits: 2 });
  await page.getByRole('button', { name: "Give ₹43,200 to Qur'an Nazira" }).click();
  await expect(page.getByRole('button', { name: 'Payment options are open below' })).toBeVisible();
  const amount = page.getByLabel(/Donation amount/);
  await expect(amount).toHaveValue('43200');
  await expect(amount).toHaveAttribute('readonly', '');
  await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
  await page.getByLabel('Full name').fill('Synthetic Donor');
  await page.getByLabel('Email').fill('synthetic@example.test');
  await page.locator('input[name="domesticConfirmed"]').check();
  await page.getByRole('button', { name: 'Continue securely →' }).click();
  await expect.poll(() => body).toBeTruthy();
  expect(body).toMatchObject({ fundSlug: 'taleem', sponsorshipProgramme: 'nazira', sponsorshipUnits: 3, sponsorshipMonths: 12 });
  expect(Number(body.amount)).toBe(43200);
  expect(body).not.toHaveProperty('campaignSlug');
  expect(body).not.toHaveProperty('appealId');
});

test('Taleem direct transfer guidance matches the fund and retains the selected quote without submitting payment', async ({ page }) => {
  await prepare(page);
  let requests = 0;
  for (const endpoint of ['order', 'direct-transfer']) {
    await page.route('**/api/donations/' + endpoint, route => {
      requests++;
      return route.abort('failed');
    });
  }
  await page.goto(PAGE);
  await choose(page, { programme: "Qur'an Nazira", months: '3 months', extraUnits: 1 });
  await page.getByRole('button', { name: "Give ₹7,200 to Qur'an Nazira" }).click();
  const panel = page.locator('#programme-payment');
  const guidance = 'Your contribution is recorded as verified only after Amaana matches the transfer to funds received.';
  for (const method of ['Direct UPI / QR', 'Bank transfer']) {
    await panel.getByRole('button', { name: method, exact: true }).click();
    await expect(panel.getByText(guidance, { exact: false })).toBeVisible();
    await expect(panel.getByText('Your appeal total changes only after verification.', { exact: false })).toHaveCount(0);
    await expect(panel.getByLabel('Amount (INR)')).toHaveValue('7200');
    await expect(panel.getByLabel('Amount (INR)')).toHaveAttribute('readonly', '');
    await expect(panel.locator('input[name="domesticConfirmed"]')).toBeVisible();
    await expect(panel.locator('input[name="domesticConfirmed"]')).not.toBeChecked();
  }
  expect(requests).toBe(0);
});

for (const [methodLabel, paymentMethod] of [['Direct UPI / QR', 'DIRECT_UPI'], ['Bank transfer', 'BANK_TRANSFER']]) {
  test(`Taleem ${paymentMethod} posts the selected sponsorship quote and domestic confirmation to a mocked endpoint`, async ({ page }) => {
    await prepare(page);
    let claims = 0, orders = 0;
    let submitted;
    await page.route('**/api/donations/order', route => {
      orders++;
      return route.abort('failed');
    });
    await page.route('**/api/donations/direct-transfer', async route => {
      claims++;
      const request = route.request();
      const payload = request.postDataBuffer();
      const contentType = request.headers()['content-type'];
      expect(request.method()).toBe('POST');
      expect(contentType).toContain('multipart/form-data;');
      expect(payload).not.toBeNull();
      submitted = await new Response(payload, { headers: { 'content-type': contentType } }).formData();
      return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic refusal before any write.' }) });
    });
    await page.goto(PAGE);
    await choose(page, { programme: "Qur'an Nazira", months: '3 months', extraUnits: 1 });
    await page.getByRole('button', { name: "Give ₹7,200 to Qur'an Nazira" }).click();
    const panel = page.locator('#programme-payment');
    await panel.getByRole('button', { name: methodLabel, exact: true }).click();
    const submit = panel.getByRole('button', { name: 'Submit transfer for verification', exact: true });
    await expect(submit).toBeEnabled();
    await expect(panel.getByLabel('Amount (INR)')).toHaveValue('7200');
    await expect(panel.getByLabel('Amount (INR)')).toHaveAttribute('readonly', '');
    await panel.getByLabel('Full name').fill('Synthetic Taleem donor');
    await panel.getByLabel('Email').fill('taleem@example.test');
    await panel.getByLabel('UTR / transaction reference').fill('SYNTHETIC-TALEEM-123');
    await panel.getByLabel('Transfer date and time').fill('2026-11-20T10:30');
    await panel.locator('input[name="givingIntent"][value="SADAQAH"]').check();
    const domestic = panel.locator('input[name="domesticConfirmed"]');
    await expect(domestic).not.toBeChecked();
    await submit.click();
    expect(claims).toBe(0);
    await domestic.check();
    await submit.click();
    await expect(panel.getByRole('alert')).toHaveText('Synthetic refusal before any write.');
    await expect(submit).toBeEnabled();
    expect(claims).toBe(1);
    expect(orders).toBe(0);
    expect(Object.fromEntries(submitted.entries())).toMatchObject({
      fundSlug: 'taleem', paymentMethod, sponsorshipProgramme: 'nazira', sponsorshipUnits: '2',
      sponsorshipMonths: '3', amount: '7200', givingIntent: 'SADAQAH', domesticConfirmed: 'true',
      transferReference: 'SYNTHETIC-TALEEM-123',
    });
    expect(submitted.has('appealId')).toBe(false);
    expect(submitted.has('campaignSlug')).toBe(false);
    await expect(panel.getByLabel('Amount (INR)')).toHaveValue('7200');
    await expect(panel.getByLabel('UTR / transaction reference')).toHaveValue('SYNTHETIC-TALEEM-123');
  });
}

test('changing the selection after payment opens closes the payment forms, so the amount cannot go stale', async ({ page }) => {
  await prepare(page);
  await page.goto(PAGE);
  await page.getByRole('button', { name: 'Give ₹1,000 to Qaida' }).click();
  await expect(page.getByLabel(/Donation amount/)).toHaveValue('1000');
  await choose(page, { months: '3 months' });
  await expect(page.locator('#programme-payment')).toBeEmpty();
  await expect(page.getByRole('button', { name: 'Give ₹3,000 to Qaida' })).toBeVisible();
  await page.getByRole('button', { name: 'Give ₹3,000 to Qaida' }).click();
  await expect(page.getByLabel(/Donation amount/)).toHaveValue('3000');
});

test('says what the gift is, and promises no student, place or recurring charge', async ({ page }) => {
  await prepare(page);
  await page.goto(PAGE);
  const copy = await page.locator('#programme-sponsorship').innerText();
  expect(copy).toMatch(/does not name or reserve a student/);
  expect(copy).toMatch(/paid once; it is not a monthly subscription/);
  for (const forbidden of [/your child/i, /sponsor a (child|student)/i, /adopt/i, /reserved for you/i, /auto-?renew/i, /every month/i]) expect(copy).not.toMatch(forbidden);
});

for (const width of [360, 390, 768, 1280]) {
  test(`fits without horizontal scroll and has no serious accessibility violation at ${width}px`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    await expect(page.getByRole('region', { name: 'Sponsor a Taleem programme.' })).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    const closed = await new AxeBuilder({ page }).include('#programme-sponsorship').analyze();
    expect(closed.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
    await page.getByRole('button', { name: 'Give ₹1,000 to Qaida' }).click();
    await expect(page.getByLabel(/Donation amount/)).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    const open = await new AxeBuilder({ page }).include('#programme-sponsorship').analyze();
    expect(open.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
  });
}
