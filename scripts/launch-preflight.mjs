import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;

const mode = process.argv.includes("--production")
  ? "production"
  : process.argv.includes("--rehearsal")
    ? "rehearsal"
    : "candidate";

const steps = [
  {
    label: "Canonical factual locks",
    command: nodeCommand,
    args: ["--test", "scripts/test-canonical-factual-locks.mjs"],
  },
  {
    label: "Public editorial consistency tests",
    command: nodeCommand,
    args: ["--test", "scripts/test-public-editorial-consistency.mjs"],
  },
  {
    label: "Public/private data boundary tests",
    command: nodeCommand,
    args: ["--test", "scripts/test-public-data-boundaries.mjs"],
  },
  {
    label: "Launch readiness policy invariants",
    command: nodeCommand,
    args: ["--test", "scripts/test-launch-readiness.mjs"],
  },
  {
    label: "Production environment contract tests",
    command: nodeCommand,
    args: ["--test", "scripts/test-production-environment.mjs"],
  },

  {
    label: "Approved background asset hashes",
    command: nodeCommand,
    args: ["scripts/verify-approved-backgrounds.mjs"],
  },
  {
    label: "Public editorial consistency",
    command: nodeCommand,
    args: ["scripts/check-public-editorial-consistency.mjs"],
  },
  {
    label: "Public media structural boundary",
    command: nodeCommand,
    args: ["scripts/check-public-media.mjs"],
  },
  {
    label: "Public media review register structure",
    command: nodeCommand,
    args: ["scripts/check-public-media-review-register.mjs"],
  },
  {
    label: "Launch readiness register structure",
    command: nodeCommand,
    args: ["scripts/check-launch-readiness.mjs"],
  },
  {
    label: "Prisma schema",
    command: npmCommand,
    args: ["run", "prisma:validate"],
  },
  {
    label: "Lint",
    command: npmCommand,
    args: ["run", "lint"],
  },
  {
    label: "TypeScript",
    command: npmCommand,
    args: ["run", "typecheck"],
  },
  {
    label: "Unit tests",
    command: npmCommand,
    args: ["test"],
  },
  {
    label: "Production build",
    command: npmCommand,
    args: ["run", "build"],
  },
];

if (mode === "rehearsal") {
  steps.push({
    label: "Rehearsal readiness decision",
    command: nodeCommand,
    args: ["scripts/check-launch-readiness.mjs", "--rehearsal"],
  });
}

if (mode === "production") {
  steps.push(
    {
      label: "Production environment contract",
      command: nodeCommand,
      args: ["scripts/check-production-environment.mjs"],
    },
    {
      label: "Public media human-review readiness",
      command: nodeCommand,
      args: ["scripts/check-public-media-review-register.mjs", "--readiness"],
    },
    {
      label: "Production readiness decision",
      command: nodeCommand,
      args: ["scripts/check-launch-readiness.mjs", "--production"],
    },
  );
}

function runStep(step) {
  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      stdio: "inherit",
      env: process.env,
      shell: false,
    });
    child.once("error", error => resolve({ ok: false, error }));
    child.once("exit", (code, signal) => resolve({
      ok: code === 0 && !signal,
      code,
      signal,
    }));
  });
}

console.log(`Amaana launch preflight mode: ${mode}`);
console.log("This command is read-only: it validates source, tests, build output and readiness registers; it does not deploy, publish media, enable indexing or initiate payments.\n");

for (const [index, step] of steps.entries()) {
  console.log(`[${index + 1}/${steps.length}] ${step.label}`);
  const result = await runStep(step);
  if (!result.ok) {
    if (result.error) console.error(result.error);
    throw new Error(
      `${step.label} failed${result.signal ? ` from signal ${result.signal}` : ` with exit code ${result.code ?? "unknown"}`}.`,
    );
  }
  console.log(`✓ ${step.label}\n`);
}

console.log(`Amaana ${mode} preflight passed all ${steps.length} checks.`);
if (mode === "candidate") {
  console.log("Candidate preflight does not imply production approval. Human media/privacy review, payment activation, rollback rehearsal, indexing and final production authorization remain governed by the launch-readiness register.");
}
