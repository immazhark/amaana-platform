import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("refuses a non-local session test database without running teardown queries", () => {
  // Run the actual suite lifecycle. A rejected beforeAll must also stop afterAll writes.
  const result = spawnSync(process.execPath, [
    resolve("node_modules/vitest/vitest.mjs"), "run", "src/lib/auth-session.database.test.ts",
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AMAANA_DATABASE_TESTS: "true",
      DATABASE_URL: "postgresql://synthetic:synthetic@blocked.invalid:5432/amaana?connect_timeout=1",
      NO_COLOR: "1",
    },
    encoding: "utf8",
    timeout: 15_000,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  const output = result.stdout + result.stderr;
  expect(output).toContain("Admin session DB tests require the isolated loopback amaana database");
  expect(output).not.toMatch(/PrismaClient\w*Error|prisma\.\w+\.(?:delete|create|update)|Can't reach database server/);
}, 20_000);
