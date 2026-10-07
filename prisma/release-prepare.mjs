import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status ?? "unknown"}.`);
  }
}

run(process.execPath, ["prisma/migrate-deploy-with-retry.mjs"]);
run(process.execPath, ["prisma/run-db-script-with-retry.mjs", "prisma/import-reviewed-campaigns.mjs"]);

if (process.env.APP_ENVIRONMENT === "staging") {
  run(process.execPath, ["prisma/run-db-script-with-retry.mjs", "prisma/seed.mjs"]);
  run(process.execPath, ["prisma/run-db-script-with-retry.mjs", "prisma/seed-staging-acceptance.mjs"]);
}

console.log("Database release preparation completed.");
