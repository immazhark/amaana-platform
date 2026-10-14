import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const checkScript = resolve(process.cwd(), "scripts/check-client-secret-boundary.mjs");

/** Synthetic build artifacts; never load private production credentials. */
function scanClientBuild(bundle: string, variables: Record<string, string> = {}, prebuild = false) {
  const fixture = mkdtempSync(join(tmpdir(), "amaana-client-secret-boundary-"));
  try {
    const staticRoot = join(fixture, ".next", "static");
    if (!prebuild) {
      mkdirSync(staticRoot, { recursive: true });
      writeFileSync(join(staticRoot, "browser.js"), bundle, "utf8");
    }
    return spawnSync(process.execPath, [checkScript, ...(prebuild ? ["--public-env-only"] : [])], {
      cwd: fixture, encoding: "utf8",
      env: { PATH: process.env.PATH ?? "", ...variables },
    });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

describe("built client credential boundary", () => {
  it("permits publishable Razorpay key IDs and safe browser assets", () => {
    const result = scanClientBuild('window.brand = "Amaana";', {
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_public_example",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("passed");
  });

  it.each([
    "NEXT_PUBLIC_S3_ACCESS_KEY_ID",
    "NEXT_PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY",
    "NEXT_PUBLIC_PUBLIC_MEDIA_S3_ACCESS_KEY_ID",
    "NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY",
  ])("rejects public-prefixed credential environment %s even without source marker", name => {
    const result = scanClientBuild('window.brand = "Amaana";', { [name]: "synthetic-credential" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unsafe public-prefixed storage credential");
    expect(result.stderr).not.toContain("synthetic-credential");
  });

  it("blocks unsafe public credentials at prebuild without a .next output", () => {
    const rejected = scanClientBuild("", { NEXT_PUBLIC_S3_SECRET_ACCESS_KEY: "synthetic-value" }, true);
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).not.toContain("synthetic-value");
    const safe = scanClientBuild("", { NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_public" }, true);
    expect(safe.status).toBe(0);
    expect(safe.stdout).toContain("Public credential environment check passed");
  });

  it("detects inlined server values without printing secret material", () => {
    const sentinel = "synthetic-opaque-value-12345678";
    const result = scanClientBuild(`window.leak = "${sentinel}";`, {
      MEDIA_S3_SECRET_ACCESS_KEY: sentinel,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("[REDACTED SECRET VALUE]");
    expect(result.stderr).not.toContain(sentinel);
  });

  it("detects public-media access-key identifiers copied into client bundles", () => {
    const result = scanClientBuild("const credential = 'PUBLIC_MEDIA_S3_ACCESS_KEY_ID';");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("PUBLIC_MEDIA_S3_ACCESS_KEY_ID");
  });
});
