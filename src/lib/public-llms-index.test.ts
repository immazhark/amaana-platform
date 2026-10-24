import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync("public/llms.txt", "utf8");
const urls = [...source.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)].map(match => match[1]);

describe("public discovery index contract (AF-R075)", () => {
  it("exposes real, unique public routes under the canonical HTTPS origin only", () => {
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);

    for (const raw of urls) {
      const link = new URL(raw);
      expect(link.origin).toBe("https://amaanafoundation.org");
      expect(link.username).toBe("");
      expect(link.password).toBe("");
      expect(link.search).toBe("");
      expect(link.hash).toBe("");
      expect(link.pathname).toMatch(/^\/[a-z0-9-]+$/);
      expect(existsSync(join(process.cwd(), "src/app", link.pathname, "page.tsx"))).toBe(true);
    }
  });

  it("does not advertise private application, API, admin, or tracking destinations", () => {
    expect(source).toMatch(/^# Amaana Foundation\s*$/m);
    expect(urls.every(raw => !/\/(?:api|admin|_next|private)(?:\/|$)/.test(new URL(raw).pathname))).toBe(true);
    expect(source).not.toMatch(/(?:access_token|session_token|donation_token|assistance_token)=/i);
  });
});
