import { expect, test } from '@playwright/test';

test.skip(process.env.AMAANA_CSP_REPORT_ONLY !== 'true', 'This bounded diagnostic profile is opt-in; normal acceptance keeps reporting disabled.');

test('report-only script diagnostics reach the first-party collector without blocking hydration or inline execution', async ({ page }) => {
  const reports = [];
  const responses = [];
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/security/csp-report') {
      reports.push(request.postDataJSON());
    }
  });
  page.on('response', response => {
    if (new URL(response.url()).pathname === '/api/security/csp-report') responses.push(response.status());
  });
  await page.addInitScript(() => {
    window.__cspDiagnostics = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__cspDiagnostics.push({ disposition: event.disposition, directive: event.effectiveDirective });
    });
  });
  const response = await page.goto('/donations/AFD-CSP-SYNTHETIC/acknowledgement');
  expect(response?.headers()['content-security-policy-report-only']).toContain('report-uri /api/security/csp-report');
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
  await expect(page.getByRole('heading', { name: 'Private acknowledgement unavailable.' })).toBeVisible();
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__cspInlineProbe = true';
    document.head.appendChild(script);
  });
  expect(await page.evaluate(() => window.__cspInlineProbe)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__cspDiagnostics.some(event => event.disposition === 'report' && event.directive === 'script-src-elem'))).toBe(true);
  await expect.poll(() => reports.some(report => report?.['csp-report']?.disposition === 'report')).toBe(true);
  await expect.poll(() => responses.includes(204)).toBe(true);
});
