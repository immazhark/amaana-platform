import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const reviewedDetailRoutes = [
  ["stories", "stories"],
  ["our-work", "our-work"],
  ["faith-and-reflections", "faith-and-reflections"],
] as const;

it.each(reviewedDetailRoutes)(
  "AF-R071 provides a safe leaf loading fallback for /%s/[slug]",
  (route, identity) => {
    const path = join(process.cwd(), "src/app", route, "[slug]", "loading.tsx");
    expect(existsSync(path)).toBe(true);
    const source = readFileSync(path, "utf8");
    expect(source).toContain('import { PublicRouteLoading } from "@/components/public-route-loading"');
    expect(source).toContain(`route="${identity}"`);
    expect(source).not.toMatch(/use client|fetch\\(|prisma\\.|searchParams|window\\.|Math\\.random|Date\\(/);
    expect(source).not.toMatch(/beneficiar(?:y|ies)|donor|raised|funded|₹/i);
  },
);
