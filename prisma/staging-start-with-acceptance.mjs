import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

if (process.env.APP_ENVIRONMENT !== "staging") {
  throw new Error("Refusing to run the launch-acceptance startup wrapper outside staging");
}
if (process.env.STAGING_ACCEPTANCE_ON_START !== "true") {
  throw new Error("STAGING_ACCEPTANCE_ON_START must be true for the launch-acceptance startup wrapper");
}

const port = process.env.PORT || "3000";
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server.js"], {
  env: process.env,
  stdio: "inherit",
});

let shuttingDown = false;
function forward(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (server.exitCode === null) server.kill(signal);
}
process.on("SIGTERM", () => forward("SIGTERM"));
process.on("SIGINT", () => forward("SIGINT"));

async function waitForServer() {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js server exited before acceptance with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health/live`, {
        headers: { "user-agent": "Amaana-Staging-Startup-Acceptance/1.0" },
      });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await delay(500);
  }
  throw new Error("Timed out waiting for the staging server before launch acceptance");
}

try {
  await waitForServer();
  process.env.STAGING_BASE_URL = baseUrl;
  if (!process.env.EXPECTED_COMMIT_SHA?.trim() && process.env.RAILWAY_GIT_COMMIT_SHA?.trim()) {
    process.env.EXPECTED_COMMIT_SHA = process.env.RAILWAY_GIT_COMMIT_SHA.trim();
  }
  await import("./staging-launch-acceptance.mjs");
  console.log("✓ One-shot staging launch acceptance completed; keeping the verified server online.");
} catch (error) {
  console.error("Staging launch acceptance failed.", error);
  if (server.exitCode === null) server.kill("SIGTERM");
  process.exitCode = 1;
}

if (!process.exitCode) {
  const exitCode = await new Promise((resolve) => {
    server.once("exit", (code, signal) => resolve({ code, signal }));
  });
  if (exitCode.signal) {
    console.log(`Next.js server exited from signal ${exitCode.signal}`);
    process.exitCode = 0;
  } else {
    process.exitCode = exitCode.code ?? 0;
  }
}
