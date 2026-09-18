import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

if (process.env.APP_ENVIRONMENT !== "staging") {
  throw new Error("Refusing to run the launch-acceptance startup wrapper outside staging");
}
if (process.env.STAGING_ACCEPTANCE_ON_START !== "true") {
  throw new Error("STAGING_ACCEPTANCE_ON_START must be true for the launch-acceptance startup wrapper");
}

const publicPort = process.env.PORT || "3000";
const acceptancePort = process.env.STAGING_ACCEPTANCE_PORT || "18080";
if (acceptancePort === publicPort) {
  throw new Error("STAGING_ACCEPTANCE_PORT must differ from the Railway public PORT");
}

const acceptanceBaseUrl = `http://127.0.0.1:${acceptancePort}`;
let activeServer = null;
let shuttingDown = false;

function spawnServer(env) {
  const child = spawn(process.execPath, ["server.js"], {
    env,
    stdio: "inherit",
  });
  activeServer = child;
  return child;
}

function forward(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (activeServer?.exitCode === null) activeServer.kill(signal);
}
process.on("SIGTERM", () => forward("SIGTERM"));
process.on("SIGINT", () => forward("SIGINT"));

async function waitForServer(server, baseUrl) {
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
      // The internal acceptance server is still starting.
    }
    await delay(500);
  }
  throw new Error("Timed out waiting for the internal staging server before launch acceptance");
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    delay(5_000).then(() => {
      if (server.exitCode === null) server.kill("SIGKILL");
    }),
  ]);

  if (server.exitCode === null) {
    await new Promise((resolve) => server.once("exit", resolve));
  }
}

try {
  const acceptanceServer = spawnServer({
    ...process.env,
    PORT: acceptancePort,
    HOSTNAME: "127.0.0.1",
  });

  await waitForServer(acceptanceServer, acceptanceBaseUrl);
  process.env.STAGING_BASE_URL = acceptanceBaseUrl;
  if (!process.env.EXPECTED_COMMIT_SHA?.trim() && process.env.RAILWAY_GIT_COMMIT_SHA?.trim()) {
    process.env.EXPECTED_COMMIT_SHA = process.env.RAILWAY_GIT_COMMIT_SHA.trim();
  }

  await import("./staging-launch-acceptance.mjs");
  await stopServer(acceptanceServer);

  if (shuttingDown) {
    process.exitCode = 0;
  } else {
    console.log("✓ One-shot staging launch acceptance completed before opening the Railway service port.");
    const publicServer = spawnServer({
      ...process.env,
      PORT: publicPort,
      HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
      STAGING_ACCEPTANCE_ON_START: "false",
    });

    const result = await new Promise((resolve) => {
      publicServer.once("exit", (code, signal) => resolve({ code, signal }));
    });

    if (result.signal) {
      console.log(`Next.js public server exited from signal ${result.signal}`);
      process.exitCode = 0;
    } else {
      process.exitCode = result.code ?? 0;
    }
  }
} catch (error) {
  console.error("Staging launch acceptance failed before the Railway service port was opened.", error);
  if (activeServer?.exitCode === null) await stopServer(activeServer);
  process.exitCode = 1;
}
