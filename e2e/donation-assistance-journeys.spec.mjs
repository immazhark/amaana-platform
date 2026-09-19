import { expect, test } from '@playwright/test';

const receiptToken = 'receipt-token-browser-acceptance-abcdefghijklmnopqrstuvwxyz';
const trackingToken = 'tracking-token-browser-acceptance-abcdefghijklmnopqrstuvwxyz';
const donationReference = 'DON-ACCEPT-001';
const assistanceReference = 'AST-ACCEPT-001';

async function mockAnalytics(page) {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
}

async function openDonationFixture(page, mode = 'success') {
  await mockAnalytics(page);
  await page.addInitScript(selectedMode => {
    window.__AMAANA_ACCEPTANCE_RAZORPAY_MODE = selectedMode;
  }, mode);
  await page.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `
      window.Razorpay = class {
        constructor(options) { this.options = options; }
        open() {
          const mode = window.__AMAANA_ACCEPTANCE_RAZORPAY_MODE || 'success';
          if (mode === 'dismiss') {
            queueMicrotask(() => this.options.modal.ondismiss());
            return;
          }
          queueMicrotask(() => {
            void this.options.handler({
              razorpay_order_id: 'order_acceptance_001',
              razorpay_payment_id: 'pay_acceptance_001',
              razorpay_signature: 'signature_acceptance_001'
            });
          });
        }
      };
    `,
  }));

  const response = await page.goto('/browser-acceptance/donation', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Mocked donation journey' })).toBeVisible();
  const submit = page.getByRole('button', { name: 'Continue securely →' });
  await expect(submit).toBeEnabled();
  return submit;
}

async function fillDonationForm(page, amount = '250') {
  await page.getByLabel(/Donation amount/).fill(amount);
  await page.getByLabel('Full name').fill('Acceptance Donor');
  await page.getByLabel('Email').fill('acceptance@example.test');
  await page.getByLabel(/Phone/).fill('9876543210');
  await page.locator('input[name="domesticConfirmed"]').check();
}

function orderPayload() {
  return {
    donationId: 'donation-acceptance-001',
    orderId: 'order_acceptance_001',
    amount: 25000,
    currency: 'INR',
    keyId: 'rzp_test_browser_acceptance',
    appealTitle: 'Browser Acceptance Appeal',
    donor: {
      name: 'Acceptance Donor',
      email: 'acceptance@example.test',
      contact: '9876543210',
    },
    receiptToken,
  };
}

async function mockDonationOrder(page, capture) {
  await page.route('**/api/donations/order', async route => {
    capture.value = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(orderPayload()),
    });
  });
}

async function openAssistance(page) {
  await mockAnalytics(page);
  const response = await page.goto('/request-assistance', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Tell us about the request.' })).toBeVisible();
}

async function fillAssistanceForm(page) {
  await page.getByLabel('Applicant name').fill('Acceptance Applicant');
  await page.getByLabel('Phone number').fill('9000000000');
  await page.getByLabel(/Email/).fill('applicant@example.test');
  await page.getByLabel('City').fill('Hyderabad');
  await page.getByLabel('Type of assistance').selectOption('MEDICAL');
  await page.getByLabel('Describe the need').fill('This is synthetic browser acceptance data used only to verify the private assistance workflow without creating a real beneficiary request.');
  await page.locator('input[name="consent"]').check();
}

test.describe('donation journey without real payment', () => {
  test('browser constraints require an allowed amount and domestic confirmation before checkout', async ({ page }) => {
    let orderCalls = 0;
    await page.route('**/api/donations/order', route => {
      orderCalls += 1;
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Should not be called' }) });
    });
    await openDonationFixture(page, 'dismiss');

    const amount = page.getByLabel(/Donation amount/);
    const domestic = page.locator('input[name="domesticConfirmed"]');
    const form = page.locator('form.v2-donation-form');

    await amount.fill('5001');
    await page.getByLabel('Full name').fill('Acceptance Donor');
    await page.getByLabel('Email').fill('acceptance@example.test');

    expect(await amount.evaluate(input => ({ valid: input.validity.valid, rangeOverflow: input.validity.rangeOverflow }))).toEqual({
      valid: false,
      rangeOverflow: true,
    });

    await amount.fill('250');
    expect(await domestic.evaluate(input => input.validity.valueMissing)).toBe(true);
    expect(await form.evaluate(node => node.checkValidity())).toBe(false);

    await domestic.check();
    expect(await form.evaluate(node => node.checkValidity())).toBe(true);
    expect(orderCalls).toBe(0);
  });

  test('Razorpay checkout becomes ready again after the donation form remounts', async ({ page }) => {
    const submit = await openDonationFixture(page, 'dismiss');
    await expect(page.getByText('Secure checkout is ready.')).toBeVisible();

    await page.getByRole('button', { name: 'Unmount donation form' }).click();
    await expect(page.getByText('Donation form unmounted for remount acceptance.')).toBeVisible();

    await page.getByRole('button', { name: 'Remount donation form' }).click();
    const remountedSubmit = page.getByRole('button', { name: 'Continue securely →' });
    await expect(remountedSubmit).toBeEnabled();
    await expect(page.getByText('Secure checkout is ready.')).toBeVisible();

    expect(await submit.count()).toBe(0);
  });

  test('dismissing mocked Razorpay returns the form to a safe ready state', async ({ page }) => {
    const order = { value: null };
    await mockDonationOrder(page, order);
    const submit = await openDonationFixture(page, 'dismiss');
    await fillDonationForm(page);

    await submit.click();
    await expect(submit).toHaveText('Continue securely →');
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel(/Donation amount/)).toBeEnabled();
    expect(order.value).toEqual(expect.objectContaining({
      appealId: 'browser-acceptance-appeal',
      donorName: 'Acceptance Donor',
      donorEmail: 'acceptance@example.test',
      amount: '250',
      domesticConfirmed: true,
    }));
  });

  test('mocked successful verification reaches a private acknowledgement without external payment', async ({ page }) => {
    const order = { value: null };
    const confirmation = { value: null };
    await mockDonationOrder(page, order);
    await page.route('**/api/donations/confirm', async route => {
      confirmation.value = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ referenceNumber: donationReference }),
      });
    });
    await page.route('**/api/donations/acknowledgement', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: true,
        presentation: {
          tone: 'captured',
          heading: 'Donation verified.',
          summary: 'Browser acceptance mock completed without contacting a payment provider.',
          statusLabel: 'Captured',
        },
        donation: {
          referenceNumber: donationReference,
          receiptNumber: 'RCP-ACCEPT-001',
          donorName: 'Acceptance Donor',
          amount: 250,
          refundedAmount: 0,
          recordDate: '2026-09-16T00:00:00.000Z',
          providerPaymentId: 'pay_acceptance_001',
          appeal: { title: 'Browser Acceptance Appeal', slug: 'browser-acceptance-appeal' },
        },
      }),
    }));

    const submit = await openDonationFixture(page, 'success');
    await fillDonationForm(page);
    await submit.click();

    await expect(page).toHaveURL(new RegExp(`/donations/${donationReference}/acknowledgement#token=`));
    await expect(page.getByRole('heading', { name: 'Donation verified.' })).toBeVisible();
    await expect(page.getByText('RCP-ACCEPT-001')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    expect(order.value).not.toBeNull();
    expect(confirmation.value).toEqual(expect.objectContaining({
      razorpay_order_id: 'order_acceptance_001',
      razorpay_payment_id: 'pay_acceptance_001',
      razorpay_signature: 'signature_acceptance_001',
      receiptToken,
    }));
  });

  test('mocked verification failure locks the form against duplicate payment attempts', async ({ page }) => {
    const order = { value: null };
    await mockDonationOrder(page, order);
    await page.route('**/api/donations/confirm', route => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Mock payment verification is pending. Keep your payment confirmation.' }),
    }));

    const submit = await openDonationFixture(page, 'success');
    await fillDonationForm(page);
    await submit.click();

    await expect(page.locator('.form-error[role="alert"]')).toContainText('Mock payment verification is pending');
    await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
    await expect(page.getByLabel(/Donation amount/)).toBeDisabled();
    await expect(page.locator('input[name="domesticConfirmed"]')).toBeDisabled();
    await expect(page.getByText(/do not submit another payment/i).first()).toBeVisible();
  });
});

test.describe('private assistance journey', () => {
  test('server validation focuses the first rejected field and clears its inline error on edit', async ({ page }) => {
    await page.route('**/api/assistance', route => route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Please check the highlighted information and try again.',
        fields: { phone: ['Enter a valid phone number.'] },
      }),
    }));
    await openAssistance(page);
    await fillAssistanceForm(page);

    const phone = page.getByLabel('Phone number');
    await phone.fill('123');
    await page.getByRole('button', { name: 'Submit private request →' }).click();

    await expect(page.locator('.form-error[role="alert"]')).toContainText('Please check the highlighted information');
    await expect(phone).toBeFocused();
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid phone number.')).toBeVisible();

    await phone.fill('9000000000');
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid phone number.')).toHaveCount(0);
  });

  test('mocked submission redirects to fragment-only private tracking and resolves status safely', async ({ page }) => {
    let statusBody = null;
    await page.route('**/api/assistance', route => route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ referenceNumber: assistanceReference, trackingToken }),
    }));
    await page.route('**/api/assistance/status', async route => {
      statusBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          found: true,
          status: 'UNDER_VERIFICATION',
          createdAt: '2026-09-16T00:00:00.000Z',
          updatedAt: '2026-09-16T01:00:00.000Z',
        }),
      });
    });

    await openAssistance(page);
    await fillAssistanceForm(page);
    await page.getByRole('button', { name: 'Submit private request →' }).click();

    await expect(page).toHaveURL(new RegExp(`/request-assistance/received#reference=${assistanceReference}&token=`));
    await expect(page.getByText(assistanceReference)).toBeVisible();
    expect(new URL(page.url()).search).toBe('');

    await page.getByRole('link', { name: 'Track this request' }).click();
    await expect(page.getByRole('heading', { name: 'Under verification' })).toBeVisible();
    await expect(page.getByText(assistanceReference)).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    expect(statusBody).toEqual({ reference: assistanceReference, token: trackingToken });
  });

  test('legacy tracking query credentials are scrubbed into the URL fragment', async ({ page }) => {
    await mockAnalytics(page);
    await page.route('**/api/assistance/status', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: true,
        status: 'SUBMITTED',
        createdAt: '2026-09-16T00:00:00.000Z',
        updatedAt: '2026-09-16T00:00:00.000Z',
      }),
    }));

    await page.goto(`/request-assistance/status?reference=${assistanceReference}&token=${trackingToken}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Submitted' })).toBeVisible();

    const url = new URL(page.url());
    expect(url.search).toBe('');
    expect(url.hash).toContain(`reference=${assistanceReference}`);
    expect(url.hash).toContain('token=');
  });
});
