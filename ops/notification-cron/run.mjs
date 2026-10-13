import { pathToFileURL } from "node:url";

export async function runNotificationJob(env = process.env, request = fetch) {
  const target = new URL(env.NOTIFICATION_JOB_URL || "https://amaanafoundation.org/api/jobs/notifications");
  if (target.origin !== "https://amaanafoundation.org" || target.pathname !== "/api/jobs/notifications" || target.search || target.hash || target.username || target.password) {
    throw new Error("Invalid notification job URL");
  }
  if (!env.CRON_SECRET) throw new Error("Missing notification job credential");
  const response = await request(target.href, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  // Avoid logging response bodies or provider/database diagnostics.
  // Cancellation is cleanup, not part of the HTTP outcome. A stalled or failed
  // stream cancellation must not hold the worker open or mask an HTTP error.
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    // A locked response body may reject cancellation synchronously.
  }
  if (!response.ok) throw new Error(`Notification job HTTP ${response.status}`);
  return response.status;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const status = await runNotificationJob();
    console.log("notification-job", status);
  } catch {
    console.error("Notification job failed; inspect the application's notification operations.");
    process.exitCode = 1;
  }
}
