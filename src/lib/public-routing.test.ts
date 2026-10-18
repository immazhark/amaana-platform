import { describe, expect, it } from "vitest";
import { isPrivateRoute, PRIVATE_ROUTE_PREFIXES, PUBLIC_STATIC_ROUTES } from "./public-routing";

describe("public route publication policy", () => {
  it("keeps transactional and private routes out of the public static route set", () => {
    for (const route of PUBLIC_STATIC_ROUTES) {
      expect(isPrivateRoute(route.path), `${route.path} must not match a private route prefix`).toBe(false);
    }
  });

  it("protects the known private and transactional route families", () => {
    const protectedExamples = [
      "/admin",
      "/admin/appeals",
      "/api",
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

  it("matches route segments without swallowing similarly named public paths", () => {
    expect(isPrivateRoute("/apiary")).toBe(false);
    expect(isPrivateRoute("/administrator")).toBe(false);
    expect(isPrivateRoute("/donations-info")).toBe(false);
  });

  it("keeps the donate landing public while protecting appeal checkout subpaths", () => {
    expect(isPrivateRoute("/donate")).toBe(false);
    expect(isPrivateRoute("/donate/example-appeal")).toBe(true);
    expect(PUBLIC_STATIC_ROUTES.some(route => route.path === "/donate")).toBe(true);
  });

  it("publishes the new volunteer and private-feedback landing pages without exposing a case-status route", () => {
    const paths = PUBLIC_STATIC_ROUTES.map(route => route.path);
    expect(paths).toContain("/get-involved/volunteer");
    expect(paths).toContain("/contact/feedback");
    expect(isPrivateRoute("/get-involved/volunteer")).toBe(false);
    expect(isPrivateRoute("/contact/feedback")).toBe(false);
    expect(paths).not.toContain("/request-assistance/status");
  });

  it("publishes comparison as a public evidence route without opening transactional paths", () => {
    expect(PUBLIC_STATIC_ROUTES.map(route => route.path)).toContain("/impact/compare");
    expect(isPrivateRoute("/impact/compare")).toBe(false);
  });

  it("publishes the planner landing without publishing calendar downloads", () => {
    const paths = PUBLIC_STATIC_ROUTES.map(route => route.path);
    expect(paths).toContain("/get-involved/monthly-giving");
    expect(isPrivateRoute("/get-involved/monthly-giving")).toBe(false);
    expect(paths).not.toContain("/api/giving-reminder");
    expect(isPrivateRoute("/api/giving-reminder")).toBe(true);
  });

  it("does not allow duplicate publication rules", () => {
    const publicPaths = PUBLIC_STATIC_ROUTES.map(route => route.path);
    expect(new Set(publicPaths).size).toBe(publicPaths.length);
    expect(new Set(PRIVATE_ROUTE_PREFIXES).size).toBe(PRIVATE_ROUTE_PREFIXES.length);
  });
});
