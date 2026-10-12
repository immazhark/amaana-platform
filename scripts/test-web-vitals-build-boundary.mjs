import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("client telemetry remains build-time opt-in, server-side fail-closed", () => {
  const dockerfile = readFileSync("Dockerfile", "utf8");
  const server = readFileSync("src/app/api/analytics/web-vitals/route.ts", "utf8");
  const client = readFileSync("src/components/web-vitals.tsx", "utf8");
  const env = readFileSync(".env.example", "utf8");

  assert.match(dockerfile, /^ARG NEXT_PUBLIC_ENABLE_WEB_VITALS=false$/m);
  assert.match(dockerfile, /^ENV NEXT_PUBLIC_ENABLE_WEB_VITALS=\$NEXT_PUBLIC_ENABLE_WEB_VITALS$/m);
  assert.match(env, /^NEXT_PUBLIC_ENABLE_WEB_VITALS="false"$/m);
  assert.match(client, /process\.env\.NEXT_PUBLIC_ENABLE_WEB_VITALS === "true"/);
  assert.match(server, /process\.env\.NEXT_PUBLIC_ENABLE_WEB_VITALS !== "true"/);
});
