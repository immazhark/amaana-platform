import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "e2e", "fixtures");
const appTarget = path.join(root, "src", "app", "browser-acceptance");
const componentTarget = path.join(root, "src", "components", "donation-remount-fixture.tsx");
const enabled = process.env.AMAANA_BROWSER_ACCEPTANCE === "true";

await rm(appTarget, { recursive: true, force: true });
await rm(componentTarget, { force: true });

if (!enabled) {
  console.log("Browser-acceptance routes excluded from this build.");
  process.exit(0);
}

const routes = [
  "admin",
  "body-carousel",
  "direct-donation",
  "donation",
  "gallery",
  "home-hero",
  "mobile-support",
  "portfolio",
  "section-layout",
];

for (const route of routes) {
  const targetDir = path.join(appTarget, route);
  await mkdir(targetDir, { recursive: true });
  await copyFile(
    path.join(sourceRoot, "browser-acceptance", route, "page.tsx.fixture"),
    path.join(targetDir, "page.tsx"),
  );
}

await copyFile(
  path.join(sourceRoot, "components", "donation-remount-fixture.tsx.fixture"),
  componentTarget,
);

console.log(`Materialized ${routes.length} isolated browser-acceptance routes.`);
