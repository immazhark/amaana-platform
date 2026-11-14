import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const safeLeafLoadingRoutes = [
  ["stories", "stories"],
  ["faith-and-reflections", "faith-and-reflections"],
] as const;

it.each(safeLeafLoadingRoutes)(
  "AF-R071 provides a privacy-safe leaf loading fallback for /%s/[slug]",
  (route, identity) => {
    const path = join(process.cwd(), "src/app", route, "[slug]", "loading.tsx");
    expect(existsSync(path)).toBe(true);
    const source = readFileSync(path, "utf8");
    expect(source).toContain('import { PublicRouteLoading } from "@/components/public-route-loading"');
    expect(source).toContain(`route="${identity}"`);
    expect(source).not.toMatch(/use client|fetch\(|prisma\.|searchParams|window\.|Math\.random|Date\(/);
    expect(source).not.toMatch(/beneficiar(?:y|ies)|donor|raised|funded|₹/i);
  },
);

it("AF-R071 keeps /our-work/[slug] outside a leaf streaming fallback to preserve HTTP and responsive detail contracts", () => {
  const path = join(process.cwd(), "src/app/our-work/[slug]/loading.tsx");
  // A streamed fallback can commit HTTP 200 ahead of notFound/permanentRedirect
  // and expose placeholder layout to direct-navigation browser tests.
  expect(existsSync(path)).toBe(false);
});
