import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "e2e", "fixtures");
const appTarget = path.join(root, "src", "app", "browser-acceptance");
const componentTarget = path.join(root, "src", "components", "donation-remount-fixture.tsx");
const galleryTarget = path.join(root, "src", "components", "gallery-update-fixture.tsx");
const navigationReturnTarget = path.join(root, "src", "components", "navigation-return-fixture.tsx");
const appealShareTarget = path.join(root, "src", "components", "appeal-share-update-fixture.tsx");
const enabled = process.env.AMAANA_BROWSER_ACCEPTANCE === "true";

await rm(appTarget, { recursive: true, force: true });
await rm(componentTarget, { force: true });
await rm(galleryTarget, { force: true });
await rm(navigationReturnTarget, { force: true });
await rm(appealShareTarget, { force: true });

if (!enabled) {
  console.log("Browser-acceptance routes excluded from this build.");
  process.exit(0);
}

const routes = [
  "admin",
  "appeal-share",
  "body-carousel",
  "navigation-origin",
  "navigation-destination",
  "direct-donation",
  "reviewed-donation",
  "reviewed-medical",
  "donation",
  "gallery",
  "home-hero",
  "mobile-support",
  "portfolio",
  "impact-typography",
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

await copyFile(
  path.join(sourceRoot, "components", "gallery-update-fixture.tsx.fixture"),
  galleryTarget,
);

await copyFile(
  path.join(sourceRoot, "components", "navigation-return-fixture.tsx.fixture"),
  navigationReturnTarget,
);
await copyFile(
  path.join(sourceRoot, "components", "appeal-share-update-fixture.tsx.fixture"),
  appealShareTarget,
);

const imageCacheTarget = path.join(appTarget, "image-cache-source");
await mkdir(imageCacheTarget, { recursive: true });
await copyFile(
  path.join(sourceRoot, "browser-acceptance", "image-cache-source", "route.ts.fixture"),
  path.join(imageCacheTarget, "route.ts"),
);

// Synthetic SVG is served only by the isolated browser fixture; do not grant
// data: URLs an exception in the production gallery image validator.
const galleryImageTarget = path.join(appTarget, "gallery-image");
await mkdir(galleryImageTarget, { recursive: true });
await copyFile(
  path.join(sourceRoot, "browser-acceptance", "gallery-image", "route.ts.fixture"),
  path.join(galleryImageTarget, "route.ts"),
);

console.log(`Materialized ${routes.length} isolated browser-acceptance pages and the image-cache test source.`);
