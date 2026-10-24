import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runNotificationJob } from "../ops/notification-cron/run.mjs";

const env = { CRON_SECRET: "synthetic-test-credential" };

test("posts once to the production job with bounded request and no redirects", async () => {
  let calls = 0;
  const status = await runNotificationJob(env, async (url, options) => {
    calls++;
    assert.equal(url, "https://amaanafoundation.org/api/jobs/notifications");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.authorization, `Bearer ${env.CRON_SECRET}`);
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response("synthetic-private-diagnostics", { status: 200 });
  });
  assert.equal(status, 200);
  assert.equal(calls, 1);
});

test("rejects missing credential before HTTP", async () => {
  await assert.rejects(runNotificationJob({}, () => assert.fail("unexpected request")), /Missing notification job credential/);
});

for (const url of ["http://amaanafoundation.org/api/jobs/notifications", "https://example.com/api/jobs/notifications", "https://amaanafoundation.org/other", "https://user:pass@amaanafoundation.org/api/jobs/notifications", "https://amaanafoundation.org/api/jobs/notifications?x=1", "https://amaanafoundation.org/api/jobs/notifications#x"]) {
  test(`rejects unsafe target ${url}`, async () => {
    await assert.rejects(runNotificationJob({ ...env, NOTIFICATION_JOB_URL: url }, () => assert.fail("unexpected request")), /Invalid notification job URL/);
  });
}

test("rejects HTTP failure without copying response diagnostics", async () => {
  await assert.rejects(runNotificationJob(env, async () => new Response("synthetic-secret", { status: 401 })), { message: "Notification job HTTP 401" });
});

test("propagates request timeout without retrying", async () => {
  let calls = 0;
  await assert.rejects(runNotificationJob(env, async () => {
    calls++;
    throw new DOMException("synthetic timeout", "TimeoutError");
  }), { name: "TimeoutError" });
  assert.equal(calls, 1);
});

test("worker image/config do not inherit the website build or healthcheck", async () => {
  const dockerfile = await readFile(new URL("../ops/notification-cron/Dockerfile", import.meta.url), "utf8");
  assert.doesNotMatch(dockerfile, /npm|prisma|DATABASE_URL|COPY \.|HEALTHCHECK/);
  assert.match(dockerfile, /COPY --chown=node:node run\.mjs/);
  assert.match(dockerfile, /USER node/);
  const config = JSON.parse(await readFile(new URL("../ops/notification-cron/railway.json", import.meta.url), "utf8"));
  assert.equal(config.deploy.restartPolicyType, "NEVER");
  assert.equal(config.deploy.startCommand, "node --check run.mjs");
  assert.equal(config.deploy.cronSchedule, "0 0 1 1 *");
  assert.equal(config.build.builder, "DOCKERFILE");
  assert.deepEqual(config.build.watchPatterns, ["ops/notification-cron/**"]);
  assert.match(dockerfile, /CMD \["node", "--check", "run.mjs"\]/);
  assert.equal(config.deploy.healthcheckPath, undefined);
});


for (const status of [200, 401]) {
  test(`HTTP ${status} completes even when best-effort response cancellation stalls`, async () => {
    let cancelled = false;
    const response = new Response(new ReadableStream({
      cancel() {
        cancelled = true;
        return new Promise(() => {});
      },
    }), { status });
    let timeout;
    try {
      const outcome = Promise.race([
        runNotificationJob(env, async () => response),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Cancellation stalled the worker")), 250); }),
      ]);
      if (status === 200) assert.equal(await outcome, 200);
      else await assert.rejects(outcome, { message: "Notification job HTTP 401" });
      assert.equal(cancelled, true);
    } finally {
      clearTimeout(timeout);
    }
  });
}

test("failed body cancellation never masks the HTTP success or leaks diagnostics", async () => {
  const response = new Response(new ReadableStream({
    cancel() { throw new Error("private cancellation diagnostic"); },
  }));
  assert.equal(await runNotificationJob(env, async () => response), 200);
});


test("contained worker config cannot process queued notifications even if manually started", async () => {
  const active = JSON.parse(await readFile(new URL("../ops/notification-cron/railway.json", import.meta.url), "utf8"));
  const contained = JSON.parse(await readFile(new URL("../ops/notification-cron/railway.contained.json", import.meta.url), "utf8"));
  assert.deepEqual(contained, active, "default and contained worker configs must be equally non-delivering");
  const result = spawnSync(process.execPath, [
    "--import=data:text/javascript,globalThis.fetch=()=>{throw new Error('Unexpected real network call')}",
    "--check", "run.mjs",
  ], {
    cwd: fileURLToPath(new URL("../ops/notification-cron/", import.meta.url)),
    env: {},
    encoding: "utf8",
    timeout: 3000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

test("default worker startup can only parse the script, not contact production", async () => {
  const dockerfile = await readFile(new URL("../ops/notification-cron/Dockerfile", import.meta.url), "utf8");
  const config = JSON.parse(await readFile(new URL("../ops/notification-cron/railway.json", import.meta.url), "utf8"));
  assert.match(dockerfile, /CMD \["node", "--check", "run.mjs"\]/);
  assert.equal(config.deploy.startCommand, "node --check run.mjs");
  assert.equal(config.deploy.cronSchedule, "0 0 1 1 *");
  const result = spawnSync(process.execPath, ["--check", "run.mjs"], {
    cwd: fileURLToPath(new URL("../ops/notification-cron/", import.meta.url)),
    env: { CRON_SECRET: "synthetic-do-not-send-credential", NOTIFICATION_JOB_URL: "https://amaanafoundation.org/api/jobs/notifications" },
    encoding: "utf8",
    timeout: 3000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});
