import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [3_000, 7_000];
const MAX_CAPTURE_CHARS = 64 * 1024;
let activeChild = null;

function appendBounded(current, chunk) {
  const next = current + chunk;
  return next.length > MAX_CAPTURE_CHARS ? next.slice(-MAX_CAPTURE_CHARS) : next;
}

function isTransientAdvisoryLockTimeout(output) {
  return /P1002/.test(output)
    && /advisory lock/i.test(output)
    && /timed out/i.test(output);
}

function runMigrationAttempt() {
  return new Promise((resolve, reject) => {
    const child = spawn("./node_modules/.bin/prisma", ["migrate", "deploy"], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    activeChild = child;
    let output = "";

    child.stdout.on("data", chunk => {
      const text = chunk.toString();
      output = appendBounded(output, text);
      process.stdout.write(text);
    });
    child.stderr.on("data", chunk => {
      const text = chunk.toString();
      output = appendBounded(output, text);
      process.stderr.write(text);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      activeChild = null;
      resolve({ code: code ?? 1, signal, output });
    });
  });
}

function forwardSignal(signal) {
  if (activeChild?.exitCode === null) activeChild.kill(signal);
}
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGINT", () => forwardSignal("SIGINT"));

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await runMigrationAttempt();

  if (result.signal) {
    throw new Error(`Prisma migrate deploy exited from signal ${result.signal}`);
  }
  if (result.code === 0) {
    if (attempt > 1) {
      console.log(`Prisma migrate deploy succeeded on attempt ${attempt} after transient advisory-lock contention.`);
    }
    process.exit(0);
  }

  const retryable = isTransientAdvisoryLockTimeout(result.output);
  if (!retryable || attempt === MAX_ATTEMPTS) {
    throw new Error(
      retryable
        ? `Prisma migrate deploy still could not acquire its advisory lock after ${MAX_ATTEMPTS} attempts.`
        : `Prisma migrate deploy failed with exit code ${result.code}; refusing to retry a non-transient migration error.`,
    );
  }

  const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS.at(-1);
  console.warn(
    `Transient Prisma migration advisory-lock timeout on attempt ${attempt}; retrying in ${Math.round(delayMs / 1000)}s.`,
  );
  await delay(delayMs);
}
