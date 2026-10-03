import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [3_000, 7_000, 12_000, 20_000];
const MAX_CAPTURE_CHARS = 64 * 1024;
const script = process.argv[2];

if (!script) {
  throw new Error("Usage: node prisma/run-db-script-with-retry.mjs <script>");
}

function appendBounded(current, chunk) {
  const next = current + chunk;
  return next.length > MAX_CAPTURE_CHARS ? next.slice(-MAX_CAPTURE_CHARS) : next;
}

function isTransientDatabaseFailure(output) {
  return /P1001/.test(output)
    || /can't reach database server/i.test(output)
    || /ECONNRESET|ETIMEDOUT|ECONNREFUSED|connection terminated unexpectedly/i.test(output);
}

function runAttempt() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
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
    child.once("exit", (code, signal) => resolve({ code: code ?? 1, signal, output }));
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = await runAttempt();

  if (result.signal) {
    throw new Error(`${script} exited from signal ${result.signal}`);
  }
  if (result.code === 0) {
    if (attempt > 1) {
      console.log(`${script} succeeded on attempt ${attempt} after a transient database condition.`);
    }
    process.exit(0);
  }

  const retryable = isTransientDatabaseFailure(result.output);
  if (!retryable || attempt === MAX_ATTEMPTS) {
    throw new Error(
      retryable
        ? `${script} still failed after ${MAX_ATTEMPTS} transient-error retries.`
        : `${script} failed with exit code ${result.code}; refusing to retry a non-transient error.`,
    );
  }

  const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS.at(-1);
  console.warn(
    `Transient database failure while running ${script} on attempt ${attempt}; retrying in ${Math.round(delayMs / 1000)}s.`,
  );
  await delay(delayMs);
}
