import { expect, test } from "@playwright/test";
import { protectedAdminSurfaces, mutatingAdminApiRoutes, readOnlyAdminApiRoutes } from "./admin-anonymous-routes.mjs";

function expectPrivateApiHeaders(response) {
  expect(response.headers()["cache-control"] ?? "").toMatch(/no-store/i);
  expect(response.headers()["x-robots-tag"] ?? "").toMatch(/noindex.*nofollow.*noarchive/i);
}

test.describe("anonymous admin access boundaries", () => {
  for (const path of protectedAdminSurfaces) {
    test(`anonymous access to ${path} redirects to admin sign-in`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });

      expect([303, 307, 308], `${path} should redirect before protected content renders`).toContain(response.status());
      const location = response.headers().location;
      expect(location, `${path} should provide a redirect destination`).toBeTruthy();
      expect(new URL(location, response.url()).pathname).toBe("/admin/login");
    });
  }

  test("anonymous requests to every admin API fail closed before privileged work", async ({ request }) => {
    const loginResponse = await request.get("/admin/login");
    expect(loginResponse.ok()).toBeTruthy();
    const sameOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
      : new URL(loginResponse.url()).origin;

    const checks = [
      ...readOnlyAdminApiRoutes.map(path => ({ method: "GET", path })),
      ...mutatingAdminApiRoutes.map(path => ({ method: "POST", path })),
    ];

    for (const { method, path } of checks) {
      const response = method === "GET"
        ? await request.get(path)
        : await request.post(path, { headers: { Origin: sameOrigin } });

      expect(response.status(), `${method} ${path} should reject an anonymous caller`).toBe(401);
      expect(await response.json()).toEqual({ error: "Authentication required." });
      expectPrivateApiHeaders(response);
    }
  });

  test("cross-origin mutation attempts are rejected before authentication", async ({ request }) => {
    for (const path of mutatingAdminApiRoutes) {
      const response = await request.post(path, {
        headers: { Origin: "https://attacker.invalid" },
      });

      expect(response.status(), `POST ${path} should reject a foreign origin`).toBe(403);
      expect(await response.json()).toEqual({ error: "Invalid request origin." });
      expectPrivateApiHeaders(response);
    }
  });
});
