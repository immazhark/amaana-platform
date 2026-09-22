import { expect, test } from "@playwright/test";

const globalHeaders = [
  ["content-security-policy", /default-src 'self'/i],
  ["referrer-policy", /^strict-origin-when-cross-origin$/i],
  ["x-content-type-options", /^nosniff$/i],
  ["x-frame-options", /^DENY$/i],
  ["permissions-policy", /camera=\(\).*microphone=\(\).*geolocation=\(\).*payment=\(\)/i],
  ["cross-origin-opener-policy", /^same-origin$/i],
  ["cross-origin-resource-policy", /^same-site$/i],
  ["x-permitted-cross-domain-policies", /^none$/i],
  ["strict-transport-security", /max-age=63072000.*includeSubDomains.*preload/i],
];

for (const path of ["/", "/about", "/donate", "/request-assistance", "/admin/login"]) {
  test(`security headers protect ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok(), `${path} should render successfully`).toBeTruthy();

    for (const [header, pattern] of globalHeaders) {
      expect(response.headers()[header], `${path} missing/invalid ${header}`).toMatch(pattern);
    }

    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("frame-src https://api.razorpay.com https://checkout.razorpay.com");
  });
}

for (const path of ["/request-assistance", "/admin/login", "/api/health/live"]) {
  test(`private/sensitive surface ${path} is not cacheable`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok(), `${path} should render successfully`).toBeTruthy();
    expect(response.headers()["cache-control"] ?? "").toMatch(/(?:private.*)?no-store|no-store.*private/i);
  });
}


for (const path of ["/api/health/live", "/api/health/ready", "/api/health/version"]) {
  test(`operational health endpoint ${path} is never cached`, async ({ request }) => {
    const response = await request.get(path);
    expect([200, 503]).toContain(response.status());
    expect(response.headers()["cache-control"] ?? "").toMatch(/no-store/i);
  });
}

test("readiness and liveness expose only bounded operational state", async ({ request }) => {
  const live = await request.get("/api/health/live");
  expect(await live.json()).toEqual({ status: "ok" });

  const ready = await request.get("/api/health/ready");
  const readyBody = await ready.json();
  expect(["ready", "not_ready"]).toContain(readyBody.status);
  expect(Object.keys(readyBody)).toEqual(["status"]);
});

test("framework identity header is disabled", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});
