
import { afterEach, describe, expect, it } from "vitest";
import {
  canExposePublicAppeal,
  canExposeSyntheticStagingContent,
  isSyntheticStagingAppeal,
} from "./public-environment";

const original = process.env.APP_ENVIRONMENT;

afterEach(() => {
  if (original === undefined) delete process.env.APP_ENVIRONMENT;
  else process.env.APP_ENVIRONMENT = original;
});

describe("public staging content boundary", () => {
  const synthetic = { slug: "staging-checkout-acceptance", title: "STAGING TEST — Checkout acceptance" };
  const real = { slug: "medical-support", title: "A reviewed public appeal" };

  it("detects synthetic staging appeals", () => {
    expect(isSyntheticStagingAppeal(synthetic)).toBe(true);
    expect(isSyntheticStagingAppeal(real)).toBe(false);
  });

  it("allows synthetic appeals only in staging", () => {
    process.env.APP_ENVIRONMENT = "production";
    expect(canExposeSyntheticStagingContent()).toBe(false);
    expect(canExposePublicAppeal(synthetic)).toBe(false);
    expect(canExposePublicAppeal(real)).toBe(true);

    process.env.APP_ENVIRONMENT = "staging";
    expect(canExposeSyntheticStagingContent()).toBe(true);
    expect(canExposePublicAppeal(synthetic)).toBe(true);
  });
});
