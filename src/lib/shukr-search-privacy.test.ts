import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_STATIC_ROUTES, isPrivateRoute } from "./public-routing";

describe("optional donor recognition does not create a search-index persistence hazard", () => {
  it("is accessible onsite but deliberately excluded from the public sitemap", () => {
    expect(isPrivateRoute("/shukr")).toBe(false);
    expect(PUBLIC_STATIC_ROUTES.some(route => route.path === "/shukr")).toBe(false);
  });
  it("explicitly blocks search indexing and archival even for consented visible names", () => {
    const page = readFileSync(new URL("../app/shukr/page.tsx", import.meta.url), "utf8");
    expect(page).toContain("robots: { index: false, follow: false, noarchive: true }");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("export const revalidate = 0");
  });
});
