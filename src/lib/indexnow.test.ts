import { describe, expect, it } from "vitest";
import { buildIndexNowUrlList, getIndexNowConfiguration, IndexNowInputError, parseIndexNowPaths } from "./indexnow";
const env = { NODE_ENV: "test" as const, APP_ENVIRONMENT: "production", NEXT_PUBLIC_APP_URL: "https://amaanafoundation.org", NEXT_PUBLIC_ALLOW_INDEXING: "true", AMAANA_INDEXNOW_ENABLED: "true", INDEXNOW_KEY: "synthetic-key-1234" };
const config = { origin: "https://amaanafoundation.org", host: "amaanafoundation.org", key: env.INDEXNOW_KEY };
describe("IndexNow ownership and publication boundaries", () => {
  it("accepts exact official production configuration without serializing unrelated environment data", () => {
    expect(getIndexNowConfiguration(env)).toEqual(config);
    expect(getIndexNowConfiguration({ ...env, NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL + "/" })).toEqual(config);
  });
  it.each([
    { AMAANA_INDEXNOW_ENABLED: "" }, { NEXT_PUBLIC_ALLOW_INDEXING: "false" }, { APP_ENVIRONMENT: "staging" },
    { INDEXNOW_KEY: "short" }, { INDEXNOW_KEY: "x".repeat(129) }, { INDEXNOW_KEY: "bad_key_123" },
    ...["http://amaanafoundation.org", "https://amaanafoundation.org.evil.test", "https://preview.up.railway.app", "https://amaanafoundation.org:8443", "https://private@amaanafoundation.org", "https://amaanafoundation.org/path", "https://amaanafoundation.org?token=private", "https://amaanafoundation.org#private"].map(NEXT_PUBLIC_APP_URL => ({ NEXT_PUBLIC_APP_URL })),
  ])("fails closed on configuration %j", patch => expect(getIndexNowConfiguration({ ...env, ...patch })).toBeNull());
  it("trims, bounds and deduplicates canonical paths", () => {
    expect(parseIndexNowPaths(" /about\r\n/our-work\n/about\n/ ")).toEqual(["/about", "/our-work", "/"]);
    expect(parseIndexNowPaths(Array.from({ length: 100 }, (_, i) => `/page-${i}`).join("\n"))).toHaveLength(100);
  });
  it.each(["", " ", null, 1, "x".repeat(12001), Array(102).fill("/about").join("\n"),
    "https://amaanafoundation.org/about", "//evil.test", "/about?token=private", "/about#private", "/ABOUT", "/a/../about", "/a\\b", "/%61bout", "/admin", "/api/health", "/donations/private/acknowledgement", "/donate/private", "/request-assistance/status", "/shukr", "/get-involved/legacy-giving", "/appeals/private-case", "/about\n/admin/donations",
  ])("rejects unsafe or out-of-scope selection %j", value => expect(() => parseIndexNowPaths(value)).toThrow(IndexNowInputError));
  it("requires every selected path in the current sitemap and rejects entire mixed batches", () => {
    const sitemap = [{ url: config.origin + "/about" }];
    expect(buildIndexNowUrlList(["/about"], sitemap, config)).toEqual([config.origin + "/about"]);
    expect(() => buildIndexNowUrlList(["/about", "/stories/unpublished"], sitemap, config)).toThrow("absent");
    expect(() => buildIndexNowUrlList(["/about"], [{ url: "https://elsewhere.test/about" }], config)).toThrow("absent");
    expect(() => buildIndexNowUrlList(["/shukr"], [{ url: config.origin + "/shukr" }], config)).toThrow();
  });
});
