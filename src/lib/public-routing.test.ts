import { describe, expect, it } from "vitest";
import { isPrivateRoute, PRIVATE_ROUTE_PREFIXES, PUBLIC_STATIC_ROUTES } from "@/lib/public-routing";

describe("public route publication policy", () => {
  it("keeps transactional and private routes out of the public static route set", () => {
    for (const route of PUBLIC_STATIC_ROUTES) {
      expect(isPrivateRoute(route.path), `${route.path} must not match a private route prefix`).toBe(false);
    }
  });

  it("protects the known private and transactional route families", () => {
    const protectedExamples = [
      "/admin/appeals",
      "/api/donations/order",
      "/donate/example-appeal",
      "/donations/AF-EXAMPLE/acknowledgement",
      "/request-assistance/status",
      "/request-assistance/received",
    ];

    for (const path of protectedExamples) {
      expect(isPrivateRoute(path), `${path} must remain private`).toBe(true);
    }
  });

  it("does not allow duplicate publication rules", () => {
    const publicPaths = PUBLIC_STATIC_ROUTES.map(route => route.path);
    expect(new Set(publicPaths).size).toBe(publicPaths.length);
    expect(new Set(PRIVATE_ROUTE_PREFIXES).size).toBe(PRIVATE_ROUTE_PREFIXES.length);
  });
});
