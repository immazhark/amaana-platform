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

test.describe('order error feedback handles untrusted field data', () => {
  for (const [label, fieldValue] of [
    ['nested object', [{ message: 'not a string' }]],
    ['text instead of string list', 'invalid field'],
    ['null instead of string list', null],
  ]) {
    test(`malformed ${label} does not crash donation form`, async ({ page }) => {
      let requests = 0;
      await page.route('**/api/donations/order', route => {
        requests++;
        return route.fulfill({
          status: 400, contentType: 'application/json',
          body: JSON.stringify({
            error: 'Please check the highlighted donation information.',
            fields: { donorName: fieldValue },
          }),
        });
      });
      const submit = await openDonationFixture(page, 'count-only');
      await fillDonationForm(page);
      await submit.click();
      await expect(page.locator('.form-error[role="alert"]')).toContainText('Please check');
      await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
      await expect(submit).toBeEnabled();
      expect(requests).toBe(1);
    });
  }
  test('valid field feedback stays linked to the rejected input', async ({ page }) => {
    await page.route('**/api/donations/order', route => route.fulfill({
      status: 400, contentType: 'application/json',
      body: JSON.stringify({ error: 'Check donor name', fields: { donorName: ['Name requires review'] } }),
    }));
    const submit = await openDonationFixture(page, 'count-only');
    await fillDonationForm(page);
    await submit.click();
    await expect(page.getByLabel('Full name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#donor-name-error')).toHaveText('Name requires review');
    await expect(page.getByLabel('Full name')).toBeFocused();
  });
});

test.describe('bounded payment feedback stays readable', () => {
  test('whitespace-prefixed verification rejection preserves actionable feedback and lock', async ({ page }) => {
    await mockDonationOrder(page, { value: null });
    await page.route('**/api/donations/confirm', route => route.fulfill({
      status: 503, contentType: 'application/json',
      body: JSON.stringify({ error: ' '.repeat(550) + 'Payment needs reconciliation.' }),
    }));
    const submit = await openDonationFixture(page, 'success');
    await fillDonationForm(page);
    await submit.click();
    await expect(page.locator('.form-error[role="alert"]')).toContainText('Payment needs reconciliation.');
    await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
  });

  test('whitespace-prefixed pre-write rejection remains readable and correctable', async ({ page }) => {
    await page.route('**/api/donations/order', route => route.fulfill({
      status: 429, contentType: 'application/json',
      body: JSON.stringify({ error: ' '.repeat(550) + 'Please wait before trying again.' }),
    }));
    const submit = await openDonationFixture(page, 'count-only');
    await fillDonationForm(page);
    await submit.click();
    await expect(page.locator('.form-error[role="alert"]')).toContainText('Please wait before trying again.');
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
  });
});

test.describe('checkout rejects malformed successful order responses', () => {
  for (const [label, patch] of [
    ['order identity', { orderId: null }],
    ['payment amount', { amount: 100 }],
    ['currency', { currency: 'USD' }],
    ['provider key', { keyId: {} }],
    ['receipt token', { receiptToken: null }],
    ['donor details', { donor: null }],
  ]) {
    test(`invalid ${label} locks checkout without duplicate requests`, async ({ page }) => {
      let orders = 0;
      await page.route('**/api/donations/order', route => {
        orders++;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...orderPayload(), ...patch }),
        });
      });
      const submit = await openDonationFixture(page, 'success');
      await fillDonationForm(page);
      await submit.click();
      await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
      await expect(page.locator('.form-error[role="alert"]')).toContainText('An order may have been recorded');
      await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
      await expect(page.getByLabel(/Donation amount/)).toHaveValue('250');
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(orders).toBe(1);
    });
  }
});

test('R-041 both donation methods use whole-rupee text controls instead of number spinners', async ({ page }) => {
  await openMethodFixture(page, 'Secure online payment');
  const online = page.getByLabel(/Donation amount/);
  await expect(online).toHaveAttribute('type', 'text');
  await expect(online).toHaveAttribute('inputmode', 'numeric');
  await expect(online).toHaveAttribute('pattern', '[0-9]+');
  await online.fill('12.50');
  expect(await online.evaluate(input => input.checkValidity())).toBe(false);
  await online.fill('250');
  expect(await online.evaluate(input => input.checkValidity())).toBe(true);
  await page.getByRole('button', { name: 'Direct UPI / QR', exact: true }).click();
  const transfer = page.getByLabel('Amount (INR)');
  await expect(transfer).toHaveAttribute('type', 'text');
  await expect(transfer).toHaveAttribute('inputmode', 'numeric');
  await expect(transfer).toHaveAttribute('pattern', '[0-9]+');
  await transfer.fill('12.50');
  expect(await transfer.evaluate(input => input.checkValidity())).toBe(false);
  await transfer.fill('250');
  expect(await transfer.evaluate(input => input.checkValidity())).toBe(true);
});

test('assistance errors are linked before keyboard focus reaches invalid input', async ({ page }) => {
  await openAssistance(page);
  await page.evaluate(() => {
    window.__amaanaInvalidFocusLinked = null;
    document.addEventListener('focusin', (event) => {
      if (event.target instanceof HTMLInputElement && event.target.name === 'applicantName' && event.target.getAttribute('aria-invalid') === 'true') {
        const describedBy = event.target.getAttribute('aria-describedby');
        window.__amaanaInvalidFocusLinked = Boolean(describedBy && document.getElementById(describedBy));
      }
    });
  });
  await page.getByRole('button', { name: 'Continue to need →' }).click();
  await expect(page.getByLabel('Applicant name')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.__amaanaInvalidFocusLinked)).toBe(true);
});

test('rapid assistance step changes leave focus on the currently visible step', async ({ page }) => {
  await openAssistance(page);
  await page.getByLabel('Applicant name').fill('Acceptance Applicant');
  await page.getByLabel('Phone number').fill('9000000000');
  await page.getByLabel('City').fill('Hyderabad');

  await page.getByRole('button', { name: 'Continue to need →' }).click();
  await page.getByRole('button', { name: /Contact/ }).click();

  await expect(page.locator('#assistance-step-1')).toBeVisible();
  await expect(page.locator('#assistance-step-2')).toBeHidden();
  await expect(page.locator('#assistance-step-1')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Assistance request progress' }).locator('[aria-live="polite"]')).toContainText('Step 1 of 4');
});

test('assistance step validation announces required fields and moves focus', async ({ page }) => {
  await openAssistance(page);
  await page.getByRole('button', { name: 'Continue to need →' }).click();
  const name = page.getByLabel('Applicant name');
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#name-error')).toBeVisible();
  await expect(name).toHaveAttribute('aria-describedby', 'name-error');

  await name.fill('Acceptance Applicant');
  await expect(page.locator('#name-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue to need →' }).click();
  const phone = page.getByLabel('Phone number');
  await expect(phone).toBeFocused();
  await expect(phone).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#phone-error')).toBeVisible();
});

async function fillAssistanceForm(page, { stopAtEvidence = false } = {}) {
  await page.getByLabel('Applicant name').fill('Acceptance Applicant');
  await page.getByLabel('Phone number').fill('9000000000');
  await page.getByLabel(/Email/).fill('applicant@example.test');
  await page.getByLabel('City').fill('Hyderabad');
  await page.getByRole('button', { name: 'Continue to need →' }).click();

  await page.getByLabel('Type of assistance').selectOption('MEDICAL');
  await page.getByLabel('Describe the need').fill('This is synthetic browser acceptance data used only to verify the private assistance workflow without creating a real beneficiary request.');
  await page.getByRole('button', { name: 'Continue to evidence →' }).click();

  if (stopAtEvidence) return;
  await finishAssistanceConfirmation(page);
}

async function finishAssistanceConfirmation(page) {
  await page.getByRole('button', { name: 'Continue to confirm →' }).click();
  await page.locator('input[name="consent"]').check();
}

// Release-candidate browser gate: keep this suite active whenever checkout or runtime hardening changes.
test.describe('donation journey without real payment', () => {
  for (const selectedIntent of ['GENERAL', 'SADAQAH', 'ZAKAT', null]) {
    test(`rejected giving intention focuses ${selectedIntent ?? 'first radio when unchecked'}`, async ({ page }) => {
      let orderCalls = 0;
      await page.route('**/api/donations/order', route => {
        orderCalls += 1;
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Please review the giving intention.',
            fields: { givingIntent: ['Choose a supported intention.'] },
          }),
        });
      });
      const submit = await openDonationFixture(page, 'dismiss');
      await fillDonationForm(page);
      if (selectedIntent) {
        await page.locator(`input[name="givingIntent"][value="${selectedIntent}"]`).check();
      } else {
        await page.locator('form').evaluate(form => {
          // Synthetic setup reaches the server-rejection fallback with no checked radio.
          form.noValidate = true;
          for (const radio of form.querySelectorAll('input[name="givingIntent"]')) radio.checked = false;
        });
      }
      await submit.click();

      const target = page.locator(`input[name="givingIntent"][value="${selectedIntent ?? 'GENERAL'}"]`);
      await expect(target).toBeFocused();
      const group = page.getByRole('group', { name: 'Giving intention', exact: true });
      await expect(group).toHaveAttribute('aria-invalid', 'true');
      await expect(group).toHaveAttribute('aria-describedby', 'giving-intent-error');
      await expect(page.locator('#giving-intent-error')).toHaveText('Choose a supported intention.');
      if (selectedIntent) await expect(target).toBeChecked();
      else await expect(target).not.toBeChecked();
      expect(orderCalls).toBe(1);
    });
  }

  test('donation order validation focuses the rejected field, not only the summary', async ({ page }) => {
    let orderCalls = 0;
    await page.route('**/api/donations/order', async route => {
      orderCalls += 1;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Please correct the highlighted donation details.',
          fields: { donorEmail: ['Check the email address.'] },
        }),
      });
    });
    const submit = await openDonationFixture(page, 'dismiss');
    await fillDonationForm(page);
    await submit.click();

    const email = page.getByLabel('Email');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', /donor-email-error/);
    await expect(page.locator('#donor-email-error')).toHaveText('Check the email address.');
    await expect(page.locator('.form-error[role="alert"]')).toContainText('Please correct the highlighted donation details.');
    expect(orderCalls).toBe(1);

    await email.fill('corrected@example.test');
    await expect(email).toBeFocused();
    await expect(page.locator('#donor-email-error')).toHaveCount(0);
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('invalid donation fields expose inline linked errors before checkout', async ({ page }) => {
    let orderCalls = 0;
    await page.route('**/api/donations/order', route => {
      orderCalls += 1;
      return route.fulfill({ status: 500, body: 'unexpected order request' });
    });
    const submit = await openDonationFixture(page, 'dismiss');
    await submit.click();
    const amount = page.getByLabel(/Donation amount/);
    await expect(amount).toBeFocused();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#amount-error')).toBeVisible();
    await expect(amount).toHaveAttribute('aria-describedby', /amount-error/);

    await amount.fill('250');
    await expect(page.locator('#amount-error')).toHaveCount(0);
    expect(orderCalls).toBe(0);
  });

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

    await expect(amount).toHaveAttribute('type', 'text');
    await expect(amount).toHaveAttribute('inputmode', 'numeric');
    expect(await amount.evaluate(input => ({ valid: input.validity.valid, message: input.validationMessage }))).toEqual({
      valid: false,
      message: 'Enter no more than ₹5,000.',
    });
    for (const invalidValue of ['0', '1.5', '1e3', '-10']) {
      await amount.fill(invalidValue);
      expect(await amount.evaluate(input => input.checkValidity()), invalidValue).toBe(false);
    }

    await amount.fill('250');
    expect(await domestic.evaluate(input => input.validity.valueMissing)).toBe(true);
    expect(await form.evaluate(node => node.checkValidity())).toBe(false);

    await domestic.check();
    expect(await form.evaluate(node => node.checkValidity())).toBe(true);
    expect(orderCalls).toBe(0);
  });

  test('Razorpay checkout becomes ready again after the donation form remounts', async ({ page }) => {
    await openDonationFixture(page, 'dismiss');
    await expect(page.getByText('Secure checkout is ready.')).toBeVisible();

    await page.getByRole('button', { name: 'Unmount donation form' }).click();
    await expect(page.getByText('Donation form unmounted for remount acceptance.')).toBeVisible();

    await page.getByRole('button', { name: 'Remount donation form' }).click();
    const remountedSubmit = page.getByRole('button', { name: 'Continue securely →' });
    await expect(remountedSubmit).toBeEnabled();
    await expect(page.getByText('Secure checkout is ready.')).toBeVisible();

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
      givingIntent: 'GENERAL',
      domesticConfirmed: true,
    }));
  });

  test('Zakat selection is sent as donor intent when the fixture marks the appeal eligible', async ({ page }) => {
    const order = { value: null };
    await mockDonationOrder(page, order);
    const submit = await openDonationFixture(page, 'dismiss');
    await fillDonationForm(page);

    await page.getByLabel('Zakat').check();
    await submit.click();

    expect(order.value).toEqual(expect.objectContaining({
      appealId: 'browser-acceptance-appeal',
      givingIntent: 'ZAKAT',
      amount: '250',
    }));
  });

  for (const failure of [
    { name: 'rate limiting', status: 429, message: 'Please wait before starting another donation.' },
  ]) {
    test(`order API ${failure.name} restores an editable form without opening Razorpay`, async ({ page }) => {
      let checkoutOpens = 0;
      await page.addInitScript(() => {
        window.__AMAANA_ACCEPTANCE_RAZORPAY_MODE = 'count-only';
        window.__AMAANA_ACCEPTANCE_CHECKOUT_OPENS = 0;
      });
      await page.route('**/api/donations/order', route => route.fulfill({
        status: failure.status,
        contentType: 'application/json',
        body: JSON.stringify({ error: failure.message }),
      }));
      await openDonationFixture(page, 'count-only');
      await page.evaluate(() => {
        const Original = window.Razorpay;
        window.Razorpay = class extends Original {
          open() {
            window.__AMAANA_ACCEPTANCE_CHECKOUT_OPENS += 1;
            super.open();
          }
        };
      });

      const submit = page.getByRole('button', { name: 'Continue securely →' });
      await fillDonationForm(page);
      await submit.click();

      await expect(page.locator('.form-error[role="alert"]')).toContainText(failure.message);
      await expect(page.locator('.form-error[role="alert"]')).toBeFocused();
      await expect(submit).toBeEnabled();
      await expect(page.getByLabel(/Donation amount/)).toBeEnabled();
      await expect(page.getByLabel('Full name')).toBeEnabled();
      await expect(page.getByLabel('Email')).toBeEnabled();
      checkoutOpens = await page.evaluate(() => window.__AMAANA_ACCEPTANCE_CHECKOUT_OPENS);
      expect(checkoutOpens).toBe(0);
    });
  }

  for (const outcome of ['server-error', 'gateway-error', 'lost-response']) {
    test(`uncertain checkout ${outcome} locks the form and prevents another order`, async ({ page }) => {
      let attempts = 0;
      await page.route('**/api/donations/order', route => {
        attempts++;
        if (outcome === 'lost-response') return route.abort('failed');
        return route.fulfill({
          status: outcome === 'gateway-error' ? 502 : 500,
          contentType: outcome === 'gateway-error' ? 'text/html' : 'application/json',
          body: outcome === 'gateway-error'
            ? '<html><body>Gateway unavailable</body></html>'
            : JSON.stringify({ error: 'Unexpected server failure' }),
        });
      });
      const submit = await openDonationFixture(page, 'count-only');
      await fillDonationForm(page);
      await submit.click();
      await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
      await expect(page.locator('.form-error[role="alert"]')).toContainText('An order may have been created');
      await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
      await expect(page.getByLabel(/Donation amount/)).toHaveValue('250');
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(attempts).toBe(1);
    });
  }

  test('controls remain locked while the order request is unresolved', async ({ page }) => {
    let releaseOrder;
    await page.route('**/api/donations/order', async route => {
      await new Promise(resolve => { releaseOrder = resolve; });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(orderPayload()),
      });
    });

    const submit = await openDonationFixture(page, 'dismiss');
    await fillDonationForm(page);
    await submit.click();

    await expect(page.getByRole('button', { name: 'Opening secure checkout…' })).toBeDisabled();
    await expect(page.getByLabel(/Donation amount/)).toBeDisabled();
    await expect(page.getByLabel('Full name')).toBeDisabled();
    await expect(page.getByLabel('Email')).toBeDisabled();
    await expect(page.getByLabel(/Phone/)).toBeDisabled();
    await expect(page.locator('input[name="domesticConfirmed"]')).toBeDisabled();

    releaseOrder();
    await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
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
          givingIntent: 'GENERAL',
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

    await expect(page.getByRole('heading', { name: 'Donation verified.' })).toBeVisible();
    await expect(page).toHaveURL(`/donations/${donationReference}/acknowledgement`);
    await expect(page.getByText('RCP-ACCEPT-001')).toBeVisible();
    await expect(page.getByText('General Charity')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    expect(order.value).not.toBeNull();
    expect(confirmation.value).toEqual(expect.objectContaining({
      razorpay_order_id: 'order_acceptance_001',
      razorpay_payment_id: 'pay_acceptance_001',
      razorpay_signature: 'signature_acceptance_001',
      receiptToken,
    }));
  });

  for (const reference of [undefined, null, 123, '', '../admin', 'a'.repeat(81)]) {
    test(`malformed confirmation reference ${JSON.stringify(reference)} retains payment follow-up without invalid navigation`, async ({ page }) => {
      let orders = 0;
      let confirmations = 0;
      await page.route('**/api/donations/order', route => {
        orders++;
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(orderPayload()) });
      });
      await page.route('**/api/donations/confirm', route => {
        confirmations++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ referenceNumber: reference }) });
      });
      const submit = await openDonationFixture(page, 'success');
      await fillDonationForm(page);
      await submit.click();
      await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
      await expect(page.locator('.form-error[role="alert"]')).toContainText('retain your Razorpay payment confirmation');
      await expect(page.getByLabel(/Donation amount/)).toBeDisabled();
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(new URL(page.url()).pathname).toBe('/browser-acceptance/donation');
      expect(orders).toBe(1);
      expect(confirmations).toBe(1);
    });
  }

  for (const [label, error] of [['object', { detail: 'invalid error object' }], ['array', [{ detail: 'invalid error object' }]], ['number', 123], ['null', null], ['empty', '']]) {
    test(`malformed ${label} verification error retains the form and follow-up guidance`, async ({ page }) => {
      let confirmations = 0;
      await mockDonationOrder(page, { value: null });
      await page.route('**/api/donations/confirm', route => {
        confirmations++;
        return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error }) });
      });
      const submit = await openDonationFixture(page, 'success');
      await fillDonationForm(page);
      await submit.click();
      await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
      const alert = page.locator('.form-error[role="alert"]');
      await expect(alert).toContainText('Payment verification is pending');
      await expect(alert).toBeFocused();
      await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
      await expect(page.getByLabel(/Donation amount/)).toBeDisabled();
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(confirmations).toBe(1);
      expect(new URL(page.url()).pathname).toBe('/browser-acceptance/donation');
    });
  }

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

test.describe('direct donation browser journey without real transfer', () => {
  test('direct UPI stays pending until reconciliation and scrubs the private token', async ({ page }) => {
    await mockAnalytics(page);
    let submittedBody = '';

    await page.route('**/api/donations/direct-transfer', async route => {
      const body = route.request().postDataBuffer();
      submittedBody = body ? body.toString('utf8') : '';
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          referenceNumber: 'AFD-DIRECT-ACCEPT-001',
          receiptToken,
          status: 'PENDING_VERIFICATION',
        }),
      });
    });
    await page.route('**/api/donations/acknowledgement', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: true,
        presentation: {
          tone: 'pending',
          heading: 'Your transfer is awaiting verification.',
          summary: 'Amaana recorded the submitted UTR. It will count only after bank reconciliation.',
          statusLabel: 'Verification pending',
        },
        donation: {
          referenceNumber: 'AFD-DIRECT-ACCEPT-001',
          receiptNumber: null,
          donorName: 'Acceptance Donor',
          givingIntent: 'GENERAL',
          amount: 250,
          refundedAmount: 0,
          recordDate: '2026-09-30T05:00:00.000Z',
          providerPaymentId: null,
          appeal: { title: 'Browser Acceptance Appeal', slug: 'browser-acceptance-appeal' },
        },
      }),
    }));

    const response = await page.goto('/browser-acceptance/direct-donation', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Mocked multi-method donation journey' })).toBeVisible();

    await page.getByRole('button', { name: 'Direct UPI / QR' }).click();
    await expect(page.getByText('mab.037347029220157@axisbank')).toBeVisible();
    await expect(page.getByText(/Verified QR image is not configured yet/)).toBeVisible();

    await page.getByLabel('Full name').fill('Acceptance Donor');
    await page.getByLabel('Email').fill('acceptance@example.test');
    const transferAmount = page.getByLabel('Amount (INR)');
    await expect(transferAmount).toHaveAttribute('type', 'text');
    await expect(transferAmount).toHaveAttribute('inputmode', 'numeric');
    for (const invalidValue of ['1e3', '1.5', '5001', '9']) {
      await transferAmount.fill(invalidValue);
      expect(await transferAmount.evaluate(input => input.checkValidity()), invalidValue).toBe(false);
    }
    await transferAmount.fill('250');
    expect(await transferAmount.evaluate(input => input.checkValidity())).toBe(true);
    await page.getByLabel('UTR / transaction reference').fill('UTRACCEPT12345');
    await page.getByLabel('Transfer date and time').fill('2026-09-30T10:30');
    await page.locator('input[name="domesticConfirmed"]').check();
    await page.getByRole('button', { name: 'Submit transfer for verification' }).click();

    await expect(page.getByRole('heading', { name: 'Your transfer is awaiting verification.' })).toBeVisible();
    expect(page.url()).toBe('http://127.0.0.1:3000/donations/AFD-DIRECT-ACCEPT-001/acknowledgement');
    expect(submittedBody).toContain('name="paymentMethod"');
    expect(submittedBody).toContain('DIRECT_UPI');
    expect(submittedBody).toContain('UTRACCEPT12345');
    expect(submittedBody).toContain('name="domesticConfirmed"');
    expect(submittedBody).toContain('true');
  });
});

async function openMethodFixture(page, method = 'Direct UPI / QR') {
  await mockAnalytics(page);
  await page.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: `window.Razorpay = class {
      constructor(options) { this.options = options; }
      open() { window.__checkoutOptions = this.options; }
    };`,
  }));
  const response = await page.goto('/browser-acceptance/direct-donation', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  if (method === 'Secure online payment') {
    await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
  } else {
    await page.getByRole('button', { name: method, exact: true }).click();
  }
}

async function fillTransferForm(page) {
  await page.getByLabel('Full name').fill('Acceptance Donor');
  await page.getByLabel('Email').fill('acceptance@example.test');
  await page.getByLabel('Amount (INR)').fill('250');
  await page.getByLabel('UTR / transaction reference').fill('UTRACCEPT12345');
  await page.getByLabel('Transfer date and time').fill('2026-09-30T10:30');
  await page.locator('input[name="domesticConfirmed"]').check();
}

async function expectMethodsLocked(page) {
  const methods = page.getByRole('group', { name: 'Choose donation method' }).getByRole('button');
  await expect(methods).toHaveCount(3);
  for (const method of await methods.all()) await expect(method).toBeDisabled();
}

test('a payment callback after its checkout form unmounts confirms without stale navigation', async ({ page }) => {
  let confirmations = 0;
  await page.route('**/api/donations/order', route => route.fulfill({
    status: 201, contentType: 'application/json', body: JSON.stringify(orderPayload()),
  }));
  await page.route('**/api/donations/confirm', route => {
    confirmations++;
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ referenceNumber: donationReference }),
    });
  });
  await openMethodFixture(page, 'Secure online payment');
  await fillDonationForm(page);
  await page.getByRole('button', { name: 'Continue securely →' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(window.__checkoutOptions))).toBe(true);
  await page.evaluate(() => window.__checkoutOptions.modal.ondismiss());
  await expect(page.getByRole('button', { name: 'Direct UPI / QR', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Direct UPI / QR', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pay Amaana directly by UPI.' })).toBeVisible();
  await page.evaluate(async () => {
    await window.__checkoutOptions.handler({
      razorpay_order_id: 'order_acceptance_001',
      razorpay_payment_id: 'pay_acceptance_001',
      razorpay_signature: 'signature_acceptance_001',
    });
  });
  expect(confirmations).toBe(1);
  await expect(page.getByRole('heading', { name: 'Pay Amaana directly by UPI.' })).toBeVisible();
  await expect(page).toHaveURL('/browser-acceptance/direct-donation');
});

test.describe('donation submission state survives method and provider callbacks', () => {
  for (const scenario of ['server-error', 'lost-response', 'html-response', 'missing-token', 'already-submitted']) {
    test(`direct transfer ${scenario} keeps follow-up state and prevents another submission`, async ({ page }) => {
      let requests = 0;
      await page.route('**/api/donations/direct-transfer', async route => {
        requests++;
        if (scenario === 'lost-response') return route.abort('failed');
        if (scenario === 'html-response') return route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Gateway error</h1>' });
        const status = scenario === 'missing-token' ? 202 : scenario === 'already-submitted' ? 409 : 500;
        const body = scenario === 'missing-token'
          ? { referenceNumber: donationReference, status: 'PENDING_VERIFICATION' }
          : { error: 'Upstream response', submissionUncertain: true };
        await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
      });
      await openMethodFixture(page);
      await fillTransferForm(page);
      await page.getByRole('button', { name: 'Submit transfer for verification' }).click();
      const alert = page.locator('.form-error[role="alert"]');
      await expect(alert).toContainText('contact Amaana before submitting again');
      await expect(alert).toBeFocused();
      await expect(alert.getByRole('link', { name: 'Contact Amaana about this transfer' })).toHaveAttribute('href', '/contact');
      await expectMethodsLocked(page);
      await expect(page.getByLabel('UTR / transaction reference')).toHaveValue('UTRACCEPT12345');
      await expect(page.getByRole('button', { name: 'Transfer follow-up required' })).toBeDisabled();
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(requests).toBe(1);
    });
  }

  test('same-event duplicate transfer submission and method change cannot discard an in-flight request', async ({ page }) => {
    let requests = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/donations/direct-transfer', async route => {
      requests++;
      await gate;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Outcome unavailable', submissionUncertain: true }) });
    });
    await openMethodFixture(page);
    await fillTransferForm(page);
    await page.locator('form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      document.querySelector('[aria-label="Choose donation method"] button:last-child').click();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await expect.poll(() => requests).toBe(1);
    await expectMethodsLocked(page);
    await expect(page.getByRole('button', { name: 'Direct UPI / QR', exact: true })).toHaveAttribute('aria-pressed', 'true');
    release();
    await expect(page.getByRole('button', { name: 'Transfer follow-up required' })).toBeDisabled();
    expect(requests).toBe(1);
  });

  test('explicit field rejection preserves donor data, links errors and returns focus on a repeated rejection', async ({ page }) => {
    let requests = 0;
    await page.route('**/api/donations/direct-transfer', async route => {
      requests++;
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({
        error: 'Check the bank reference', fieldErrors: { transferReference: ['Enter the bank transaction reference.'] },
      }) });
    });
    await openMethodFixture(page, 'Bank transfer');
    await fillTransferForm(page);
    const reference = page.getByLabel('UTR / transaction reference');
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.getByRole('button', { name: 'Submit transfer for verification' }).click();
      await expect(reference).toBeFocused();
      await expect(reference).toHaveAttribute('aria-invalid', 'true');
      const errorId = await reference.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${errorId}"]`)).toHaveText('Enter the bank transaction reference.');
      await expect(page.getByLabel('Full name')).toHaveValue('Acceptance Donor');
      await reference.fill(`UTRCORRECT${attempt}12345`);
      await expect(reference).not.toHaveAttribute('aria-invalid', 'true');
      await expect(reference).toBeFocused();
    }
    expect(requests).toBe(2);
    await expect(page.getByRole('button', { name: 'Direct UPI / QR', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Direct UPI / QR', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Pay Amaana directly by UPI.' })).toBeVisible();
  });

  test('native invalid transfer input has persistent linked feedback and sends no request', async ({ page }) => {
    let requests = 0;
    await page.route('**/api/donations/direct-transfer', route => { requests++; return route.abort(); });
    await openMethodFixture(page);
    await page.getByRole('button', { name: 'Submit transfer for verification' }).click();
    const name = page.getByLabel('Full name');
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    const errorId = await name.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${errorId}"]`)).toBeVisible();
    expect(requests).toBe(0);
  });

  test('clipboard denial provides manual-copy guidance without changing transfer state', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
    });
    await openMethodFixture(page);
    await page.getByRole('button', { name: 'Copy UPI ID' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Could not copy upi id' })).toContainText('copy it manually');
    await expect(page.getByRole('button', { name: 'Submit transfer for verification' })).toBeEnabled();
  });

  test('Razorpay dismissal after payment callback cannot unlock verification or create duplicate confirmation', async ({ page }) => {
    let orders = 0;
    let confirmations = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/donations/order', async route => {
      orders++;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(orderPayload()) });
    });
    await page.route('**/api/donations/confirm', async route => {
      confirmations++;
      await gate;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Keep your payment confirmation.' }) });
    });
    await openMethodFixture(page, 'Secure online payment');
    await fillDonationForm(page);
    await page.locator('form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      document.querySelector('[aria-label="Choose donation method"] button:last-child').click();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await expect.poll(() => page.evaluate(() => Boolean(window.__checkoutOptions))).toBe(true);
    await page.evaluate(() => {
      const payment = { razorpay_order_id: 'order_acceptance_001', razorpay_payment_id: 'pay_acceptance_001', razorpay_signature: 'signature_acceptance_001' };
      void window.__checkoutOptions.handler(payment);
      window.__checkoutOptions.modal.ondismiss();
      void window.__checkoutOptions.handler(payment);
    });
    await expect.poll(() => confirmations).toBe(1);
    await expect(page.getByRole('button', { name: 'Verifying donation…' })).toBeDisabled();
    await expectMethodsLocked(page);
    release();
    await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
    await page.evaluate(() => window.__checkoutOptions.modal.ondismiss());
    await expectMethodsLocked(page);
    expect(orders).toBe(1);
    expect(confirmations).toBe(1);
  });

  test('a delayed dismissal from an earlier checkout cannot unlock a newer order request', async ({ page }) => {
    let orders = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/api/donations/order', async route => {
      orders++;
      if (orders === 2) await gate;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(orderPayload()) });
    });
    await openMethodFixture(page, 'Secure online payment');
    await fillDonationForm(page);
    await page.getByRole('button', { name: 'Continue securely →' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(window.__checkoutOptions))).toBe(true);
    await page.evaluate(() => {
      window.__previousCheckout = window.__checkoutOptions;
      window.__previousCheckout.modal.ondismiss();
    });
    await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
    await page.getByRole('button', { name: 'Continue securely →' }).click();
    await expect.poll(() => orders).toBe(2);
    await page.evaluate(() => window.__previousCheckout.modal.ondismiss());
    await expectMethodsLocked(page);
    await expect(page.getByRole('button', { name: 'Opening secure checkout…' })).toBeDisabled();
    release();
    await expect.poll(() => page.evaluate(() => window.__checkoutOptions !== window.__previousCheckout)).toBe(true);
    await expectMethodsLocked(page);
  });

  for (const newerOutcome of ['accepted', 'server-error', 'malformed']) {
    test(`an earlier payment callback supersedes a pending newer ${newerOutcome} order without opening another checkout`, async ({ page }) => {
      let orders = 0;
      let confirmations = 0;
      let confirmationBody;
      let releaseOrder;
      let releaseConfirmation;
      const orderGate = new Promise(resolve => { releaseOrder = resolve; });
      const confirmationGate = new Promise(resolve => { releaseConfirmation = resolve; });
      await page.route('**/api/donations/order', async route => {
        orders++;
        const second = orders === 2;
        if (second) await orderGate;
        await route.fulfill({ status: second && newerOutcome === 'server-error' ? 500 : 201, contentType: 'application/json',
          body: second && newerOutcome === 'malformed' ? '{broken' : JSON.stringify(second && newerOutcome === 'server-error' ? { error: 'Newer order failed' } : second ? { ...orderPayload(), orderId: 'order_acceptance_002', receiptToken: 'receipt-token-newer-unpaid-order-abcdefghijklmnopqrstuvwxyz' } : orderPayload()) });
      });
      await page.route('**/api/donations/confirm', async route => {
        confirmations++;
        confirmationBody = route.request().postDataJSON();
        await confirmationGate;
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Keep the earlier payment confirmation.' }) });
      });
      await page.addInitScript(() => {
        window.__orderJsonCompleted = 0;
        const nativeFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await nativeFetch(...args);
          if (String(args[0]) === '/api/donations/order') {
            const nativeJson = response.json.bind(response);
            response.json = async () => {
              try { return await nativeJson(); }
              finally { window.__orderJsonCompleted++; }
            };
          }
          return response;
        };
      });
      await openMethodFixture(page, 'Secure online payment');
      await fillDonationForm(page);
      await page.getByRole('button', { name: 'Continue securely →' }).click();
      await expect.poll(() => page.evaluate(() => Boolean(window.__checkoutOptions))).toBe(true);
      await page.evaluate(() => {
        window.__previousCheckout = window.__checkoutOptions;
        window.__previousCheckout.modal.ondismiss();
      });
      await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
      await page.getByRole('button', { name: 'Continue securely →' }).click();
      await expect.poll(() => orders).toBe(2);
      await page.evaluate(() => {
        void window.__previousCheckout.handler({ razorpay_order_id: 'order_acceptance_001', razorpay_payment_id: 'pay_acceptance_001', razorpay_signature: 'signature_acceptance_001' });
      });
      await expect.poll(() => confirmations).toBe(1);
      await expect(page.getByRole('button', { name: 'Verifying donation…' })).toBeDisabled();
      releaseOrder();
      // The pending order response must finish while the paid attempt still owns
      // verification, rather than being hidden by navigation or an unmount.
      await expect.poll(() => page.evaluate(() => window.__orderJsonCompleted)).toBe(2);
      expect(await page.evaluate(() => window.__checkoutOptions === window.__previousCheckout)).toBe(true);
      await expect(page.getByRole('button', { name: 'Verifying donation…' })).toBeDisabled();
      await expect(page.locator('.form-error')).toHaveCount(0);
      releaseConfirmation();
      await expect(page.getByRole('button', { name: 'Verification follow-up required' })).toBeDisabled();
      await expect(page.locator('.form-error')).toHaveText('Keep the earlier payment confirmation.');
      await expectMethodsLocked(page);
      expect(orders).toBe(2);
      expect(confirmations).toBe(1);
      expect(confirmationBody).toEqual(expect.objectContaining({ razorpay_order_id: 'order_acceptance_001', razorpay_payment_id: 'pay_acceptance_001', receiptToken }));
      expect(await page.evaluate(() => window.__checkoutOptions === window.__previousCheckout)).toBe(true);
    });
  }

  test('Razorpay dismissal before a payment unlocks safe method selection', async ({ page }) => {
    await page.route('**/api/donations/order', route => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(orderPayload()) }));
    await openMethodFixture(page, 'Secure online payment');
    await fillDonationForm(page);
    await page.getByRole('button', { name: 'Continue securely →' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(window.__checkoutOptions))).toBe(true);
    await expectMethodsLocked(page);
    await page.evaluate(() => window.__checkoutOptions.modal.ondismiss());
    await expect(page.getByRole('button', { name: 'Continue securely →' })).toBeEnabled();
    await page.getByRole('button', { name: 'Bank transfer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Transfer directly to Amaana Foundation.' })).toBeVisible();
  });
});

test.describe('private assistance journey', () => {
  for (const outcome of ['network', 'server', 'malformed', 'missing-token', 'invalid-token', 'wrong-status']) {
    test(`assistance ${outcome} outcome retains a follow-up lock without duplicating the request`, async ({ page }) => {
      let submissions = 0;
      await page.route('**/api/assistance', route => {
        submissions += 1;
        if (outcome === 'network') return route.abort('failed');
        return route.fulfill({
          status: outcome === 'server' ? 503 : outcome === 'wrong-status' ? 200 : 201,
          contentType: 'application/json',
          body: outcome === 'malformed' ? '{broken' : JSON.stringify(outcome === 'server'
            ? { error: 'Please try again later.' }
            : { referenceNumber: assistanceReference, trackingToken: outcome === 'missing-token' ? undefined : outcome === 'invalid-token' ? 123 : trackingToken }),
        });
      });
      await openAssistance(page);
      await fillAssistanceForm(page);
      await page.getByRole('button', { name: 'Submit private request →' }).click();
      const summary = page.locator('.form-error[role="alert"]');
      await expect(summary).toBeFocused();
      await expect(summary).toContainText('Contact Amaana before submitting again');
      await expect(summary).not.toContainText('Please try again later');
      await expect(page.getByRole('link', { name: 'Contact Amaana about this request' })).toHaveAttribute('href', '/contact');
      await expect(page.getByRole('button', { name: 'Request follow-up required' })).toBeDisabled();
      await expect(page.locator('input[name="consent"]')).toBeDisabled();
      await expect(page.locator('input[name="applicantName"]')).toHaveValue('Acceptance Applicant');
      await page.locator('form.v2-assistance-form').evaluate(form => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      expect(submissions).toBe(1);
      expect(new URL(page.url()).pathname).toBe('/request-assistance');
    });
  }

  test('assistance same-event duplicate submissions use one multipart request and lock editing', async ({ page }) => {
    let submissions = 0;
    let release;
    await page.route('**/api/assistance', async route => {
      submissions += 1;
      await new Promise(resolve => { release = resolve; });
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Please check your phone.', fields: { phone: ['Enter a valid phone number.'] } }) });
    });
    await openAssistance(page);
    await fillAssistanceForm(page);
    await page.locator('form.v2-assistance-form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.querySelector('input[name="consent"]').click();
    });
    await expect(page.getByRole('button', { name: 'Submitting securely…' })).toBeDisabled();
    await expect(page.locator('input[name="consent"]')).toBeDisabled();
    await expect(page.locator('input[name="applicantName"]')).toBeDisabled();
    await expect(page.getByRole('button', { name: /Contact/ })).toBeDisabled();
    await expect.poll(() => submissions).toBe(1);
    release();
    await expect(page.getByLabel('Phone number')).toBeFocused();
    await expect(page.getByLabel('Phone number')).toBeEnabled();
    expect(submissions).toBe(1);
  });

  for (const status of [400, 413]) {
    test(`assistance document rejection HTTP ${status} returns to linked evidence feedback and preserves files`, async ({ page }) => {
      await page.route('**/api/assistance', route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'Please review the supporting files.', fields: { documents: ['Choose a valid supporting document.'] } }) }));
      await openAssistance(page);
      await fillAssistanceForm(page, { stopAtEvidence: true });
      const files = page.getByLabel(/Add private supporting files/);
      await files.setInputFiles({ name: 'synthetic-evidence.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 synthetic evidence') });
      await finishAssistanceConfirmation(page);
      await page.getByRole('button', { name: 'Submit private request →' }).click();
      await expect(files).toBeFocused();
      await expect(files).toHaveAttribute('aria-invalid', 'true');
      await expect(files).toHaveAttribute('aria-describedby', 'documents-help documents-error');
      await expect(page.locator('#documents-error')).toHaveText('Choose a valid supporting document.');
      expect(await files.evaluate(input => input.files[0].name)).toBe('synthetic-evidence.pdf');
      await files.setInputFiles([]);
      await expect(page.locator('#documents-error')).toHaveCount(0);
      await expect(files).not.toHaveAttribute('aria-invalid', 'true');
      await expect(files).toBeFocused();
    });
  }

  test('guided form blocks step progression until required contact fields are complete', async ({ page }) => {
    await openAssistance(page);

    await page.getByRole('button', { name: 'Continue to need →' }).click();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await expect(page.getByLabel('Applicant name')).toBeFocused();

    await page.getByLabel('Applicant name').fill('Acceptance Applicant');
    await page.getByLabel('Phone number').fill('9000000000');
    await page.getByLabel('City').fill('Hyderabad');
    await page.getByRole('button', { name: 'Continue to need →' }).click();

    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(page.getByLabel('Type of assistance')).toBeVisible();
  });

  test('guided assistance progress controls expose step targets and announce the current step', async ({ page }) => {
    await openAssistance(page);

    const progress = page.getByRole('navigation', { name: 'Assistance request progress' });
    const contactButton = progress.getByRole('button', { name: /Contact/ });
    const needButton = progress.getByRole('button', { name: /Need/ });

    await expect(contactButton).toHaveAttribute('aria-controls', 'assistance-step-1');
    await expect(needButton).toHaveAttribute('aria-controls', 'assistance-step-2');
    await expect(contactButton).toHaveAttribute('aria-current', 'step');

    const status = progress.locator('[aria-live="polite"]');
    await expect(status).toContainText('Step 1 of 4');

    await page.getByLabel('Applicant name').fill('Acceptance Applicant');
    await page.getByLabel('Phone number').fill('9000000000');
    await page.getByLabel('City').fill('Hyderabad');
    await page.getByRole('button', { name: 'Continue to need →' }).click();

    await expect(status).toContainText('Step 2 of 4');
    await expect(needButton).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#assistance-step-2')).toBeVisible();
    await expect(page.locator('#assistance-step-1')).toBeHidden();
  });

  test('returning to an earlier step cannot bypass its validation when jumping forward again', async ({ page }) => {
    await openAssistance(page);
    await fillAssistanceForm(page);

    await page.getByRole('button', { name: /Contact/ }).click();
    const city = page.getByLabel('City');
    await city.fill('');

    await page.getByRole('button', { name: /Confirm/ }).click();

    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await expect(city).toBeFocused();
    await expect(page.getByLabel('Type of assistance')).toBeHidden();
  });

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

    await page.getByRole('button', { name: /Contact/ }).click();
    const phone = page.getByLabel('Phone number');
    await phone.fill('123');
    await page.getByRole('button', { name: /Confirm/ }).click();
    await page.getByRole('button', { name: 'Submit private request →' }).click();

    await expect(page.locator('.form-error[role="alert"]')).toContainText('Please check the highlighted information');
    await expect(phone).toBeFocused();
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid phone number.')).toBeVisible();

    await phone.fill('9000000000');
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid phone number.')).toHaveCount(0);
  });

  test('supporting evidence stays in the private multipart submission without altering the public URL', async ({ page }) => {
    let contentType = '';
    let multipartBody = '';

    await page.route('**/api/assistance', async route => {
      contentType = route.request().headers()['content-type'] ?? '';
      const body = route.request().postDataBuffer();
      multipartBody = body ? body.toString('utf8') : '';
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ referenceNumber: assistanceReference, trackingToken }),
      });
    });

    await openAssistance(page);
    await fillAssistanceForm(page, { stopAtEvidence: true });

    const evidence = page.getByLabel(/Add private supporting files/);
    await evidence.setInputFiles({
      name: 'synthetic-supporting-evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 synthetic browser acceptance evidence only'),
    });

    const selected = await evidence.evaluate(input => Array.from(input.files ?? []).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
    })));
    expect(selected).toEqual([expect.objectContaining({
      name: 'synthetic-supporting-evidence.pdf',
      type: 'application/pdf',
    })]);

    await finishAssistanceConfirmation(page);
    await page.getByRole('button', { name: 'Submit private request →' }).click();

    expect(contentType).toMatch(/^multipart\/form-data;\s*boundary=/i);
    expect(multipartBody).toContain('name="documents"');
    expect(multipartBody).toContain('filename="synthetic-supporting-evidence.pdf"');
    expect(multipartBody).toContain('Content-Type: application/pdf');
    expect(multipartBody).toContain('synthetic browser acceptance evidence only');
    expect(multipartBody).toContain('name="applicantName"');
    expect(multipartBody).toContain('Acceptance Applicant');

    await expect(page).toHaveURL(new RegExp(`/request-assistance/received#reference=${assistanceReference}&token=`));
    expect(new URL(page.url()).search).toBe('');
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

  test('legacy tracking query credentials are scrubbed from the visible URL', async ({ page }) => {
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
    expect(url.hash).toBe('');
    expect(url.pathname).toBe('/request-assistance/status');
  });
});


test('private assistance tracking credentials are removed from the visible URL before status display', async ({ page }) => {
  const reference = 'AFR-PRIVATE-001';
  const token = 'private-tracking-token-1234567890';
  let postedBody = null;

  await page.route('**/api/assistance/status', async route => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: true,
        status: 'UNDER_VERIFICATION',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-22T10:00:00.000Z',
      }),
    });
  });

  await page.goto(`/request-assistance/status#reference=${reference}&token=${token}`);
  await expect(page.getByRole('heading', { name: 'Under verification' })).toBeVisible();

  expect(postedBody).toEqual({ reference, token });
  expect(page.url()).toBe('http://127.0.0.1:3000/request-assistance/status');
  expect(page.url()).not.toContain(reference);
  expect(page.url()).not.toContain(token);
  await expect(page.getByText(reference)).toBeVisible();
  await page.getByRole('link', { name: 'Understand the review process →' }).focus();
  await expect(page.getByText(reference)).toBeVisible();
});

test('legacy query-based assistance tracking is scrubbed from history-visible location', async ({ page }) => {
  const reference = 'AFR-LEGACY-001';
  const token = 'legacy-private-token-1234567890';

  await page.route('**/api/assistance/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      found: true,
      status: 'SUBMITTED',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:00:00.000Z',
    }),
  }));

  await page.goto(`/request-assistance/status?reference=${reference}&token=${token}`);
  await expect(page.getByRole('heading', { name: 'Submitted' })).toBeVisible();

  expect(page.url()).toBe('http://127.0.0.1:3000/request-assistance/status');
  expect(page.url()).not.toContain(reference);
  expect(page.url()).not.toContain(token);
});


test('private donation acknowledgement token is removed from the visible URL after capture', async ({ page }) => {
  const reference = 'AFD-2026-PRIVATE';
  const token = 'private-donation-token-1234567890';
  let postedBody = null;

  await page.route('**/api/donations/acknowledgement', async route => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        found: true,
        presentation: {
          tone: 'captured',
          heading: 'Donation received',
          summary: 'Your donation has been recorded.',
          statusLabel: 'Captured',
        },
        donation: {
          referenceNumber: reference,
          receiptNumber: 'AFR-2026-PRIVATE',
          donorName: 'Private Donor',
          givingIntent: 'GENERAL',
          amount: 500,
          refundedAmount: 0,
          recordDate: '2026-09-22T10:00:00.000Z',
          providerPaymentId: 'pay_private',
          appeal: { title: 'Verified need', slug: 'verified-need' },
        },
      }),
    });
  });

  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole('heading', { name: 'Donation received' })).toBeVisible();

  expect(postedBody).toEqual({ reference, token });
  expect(page.url()).toBe(`http://127.0.0.1:3000/donations/${reference}/acknowledgement`);
  expect(page.url()).not.toContain(token);
  await expect(page.getByText(reference)).toBeVisible();
  await page.getByRole('link', { name: /Return to this appeal/ }).focus();
  await expect(page.getByText(reference)).toBeVisible();
});

test('legacy query donation acknowledgement token is scrubbed from the visible URL', async ({ page }) => {
  const reference = 'AFD-2026-LEGACY';
  const token = 'legacy-donation-token-1234567890';

  await page.route('**/api/donations/acknowledgement', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ found: false }),
  }));

  await page.goto(`/donations/${reference}/acknowledgement?token=${token}`);
  await expect(page.getByRole('heading', { name: 'Private acknowledgement unavailable.' })).toBeVisible();

  expect(page.url()).toBe(`http://127.0.0.1:3000/donations/${reference}/acknowledgement`);
  expect(page.url()).not.toContain(token);
});
