import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("deployment version health", () => {
  it("reports non-secret staging and Razorpay Test posture", async () => {
    process.env.APP_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_example";
    process.env.RAILWAY_GIT_COMMIT_SHA = "abc123";
    process.env.RAILWAY_GIT_BRANCH = "phase-public-site-rebuild";

    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      commitSha: "abc123",
      branch: "phase-public-site-rebuild",
      environment: "staging",
      paymentMode: "test",
    });
  });

  it("reports Live mode without exposing the Razorpay key", async () => {
    process.env.APP_ENVIRONMENT = "production";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_super_secret_identifier";

    const body = await GET().json();
    expect(body.environment).toBe("production");
    expect(body.paymentMode).toBe("live");
    expect(JSON.stringify(body)).not.toContain("rzp_live_");
  });

  it("fails informationally closed when the public key is missing", async () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const body = await GET().json();
    expect(body.paymentMode).toBe("unconfigured");
  });
});
