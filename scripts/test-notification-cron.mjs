import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

for (const status of [200, 401]) {
  test(`HTTP ${status} completes even when response cancellation stalls`, async () => {
    let cancelled = false;
    const response = new Response(new ReadableStream({
      cancel() {
        cancelled = true;
        return new Promise(() => {});
      },
    }), { status });
    let timer;
    try {
      const result = Promise.race([
        runNotificationJob(env, async () => response),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("cancellation stalled")), 100); }),
      ]);
      if (status === 200) assert.equal(await result, 200);
      else await assert.rejects(result, { message: "Notification job HTTP 401" });
      assert.equal(cancelled, true);
    } finally {
      clearTimeout(timer);
    }
  });
}

test("failed response cancellation does not change successful HTTP outcome", async () => {
  const response = new Response(new ReadableStream({ cancel() { throw new Error("private diagnostic"); } }));
  assert.equal(await runNotificationJob(env, async () => response), 200);
});

test("contained deployment uses the isolated image without restoring five-minute delivery", async () => {
  const readConfig = async (name) => JSON.parse(await readFile(new URL(`../ops/notification-cron/${name}`, import.meta.url), "utf8"));
  const active = await readConfig("railway.json");
  const contained = await readConfig("railway.contained.json");
  assert.equal(contained.deploy.cronSchedule, "0 0 1 1 *");
  assert.equal(active.deploy.cronSchedule, "*/5 * * * *");
  assert.deepEqual(contained, { ...active, deploy: { ...active.deploy, cronSchedule: "0 0 1 1 *" } });
});

test("worker image/config do not inherit the website build or healthcheck", async () => {
  const dockerfile = await readFile(new URL("../ops/notification-cron/Dockerfile", import.meta.url), "utf8");
  assert.doesNotMatch(dockerfile, /npm|prisma|DATABASE_URL|COPY \.|HEALTHCHECK/);
  assert.match(dockerfile, /COPY --chown=node:node run\.mjs/);
  assert.match(dockerfile, /USER node/);
  const config = JSON.parse(await readFile(new URL("../ops/notification-cron/railway.json", import.meta.url), "utf8"));
  assert.equal(config.deploy.restartPolicyType, "NEVER");
  assert.equal(config.deploy.startCommand, "node run.mjs");
  assert.equal(config.deploy.healthcheckPath, undefined);
});
