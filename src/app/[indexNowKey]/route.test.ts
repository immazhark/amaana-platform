import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
const origin = "https://amaanafoundation.org";
const key = "synthetic-key-1234";
const request = (name = key + ".txt", base = origin, suffix = "") => GET(new Request(`${base}/${name}${suffix}`), { params: Promise.resolve({ indexNowKey: name }) });
describe("IndexNow root ownership proof", () => {
  beforeEach(() => { for (const [k,v] of Object.entries({ APP_ENVIRONMENT: "production", NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_ALLOW_INDEXING: "true", AMAANA_INDEXNOW_ENABLED: "true", INDEXNOW_KEY: key })) vi.stubEnv(k,v); });
  afterEach(() => vi.unstubAllEnvs());
  it("serves only the exact configured key as UTF-8 uncached unindexable text", async () => {
    const response = await request(); expect(response.status).toBe(200); expect(await response.text()).toBe(key);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8"); expect(response.headers.get("cache-control")).toBe("no-store"); expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
  it.each(["unknown", "robots.txt", "synthetic-old-key.txt", key])("does not expose proof at %s", async path => { const r = await request(path); expect(r.status).toBe(404); expect(await r.text()).not.toContain(key); });
  it("rejects alternate hosts and query-bearing paths", async () => { expect((await request(undefined, "https://preview.up.railway.app")).status).toBe(404); expect((await request(undefined, origin, "?token=private")).status).toBe(404); });
  it("hides revoked keys immediately when configuration or indexing is disabled", async () => { vi.stubEnv("AMAANA_INDEXNOW_ENABLED", "false"); expect((await request()).status).toBe(404); });
});
