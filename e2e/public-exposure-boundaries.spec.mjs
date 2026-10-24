import { expect, test } from "@playwright/test";

// Read-only requests against the isolated CI server, never production.
// Rejecting these paths prevents accidentally publishing repository artifacts.
const privateBuildPaths = [
  "/.env",
  "/.git/config",
  "/.npmrc",
  "/package.json",
  "/package-lock.json",
  "/prisma/schema.prisma",
];

test("repository and credential artifacts are unavailable over public HTTP", async ({ request }) => {
  for (const path of privateBuildPaths) {
    const response = await request.get(path, {
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect([403, 404], `GET ${path} must not serve repository or credential contents`).toContain(response.status());
    expect(response.headers()["x-content-type-options"], `GET ${path} must prevent content-type sniffing`).toBe("nosniff");
    expect(response.headers()["location"], `GET ${path} must not redirect to sensitive resources`).toBeUndefined();
  }
});
