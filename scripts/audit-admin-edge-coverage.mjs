/**
 * Local, read-only AF-R013 inventory. This is a proposed edge-policy scope,
 * NOT proof that a Cloudflare Access/WAF rule is configured or enforced.
 */
import { readdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = fileURLToPath(new URL("../src/app/", import.meta.url));
const publicAdminRoutes = Object.freeze(["/admin/forbidden", "/admin/login"]);

// Review this proposal whenever an admin page or API handler is added.
// The audit rejects any newly discovered route missing from the proposal.
export const proposedAdminRouteCoverage = Object.freeze([
  "/admin",
  "/admin/appeals",
  "/admin/appeals/[id]",
  "/admin/audit",
  "/admin/documents/[id]",
  "/admin/donations",
  "/admin/donations/[id]",
  "/admin/home-carousel",
  "/admin/media",
  "/admin/notifications",
  "/admin/requests/[id]",
  "/admin/retention",
  "/admin/team",
  "/api/admin/media/curated-gallery/publish",
  "/api/admin/media/curated-gallery/start",
  "/api/admin/media/curated-gallery/status",
  "/api/admin/media/curated-gallery/upload",
]);

function assertRoutes(label, paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error(`${label} must be a nonempty list`);
  }
  const seen = new Set();
  for (const path of paths) {
    if (typeof path !== "string" ||
        !/^\/(?:admin|api\/admin)(?:\/(?:[a-z0-9-]+|\[[a-z0-9-]+\]))*$/i.test(path)) {
      throw new Error(`${label} contains an invalid admin route`);
    }
    if (seen.has(path)) throw new Error(`${label} contains a duplicate route: ${path}`);
    seen.add(path);
  }
  return seen;
}

export function auditAdminEdgeCoverage({
  discovered,
  proposed,
  publicAllowlist = publicAdminRoutes,
}) {
  const found = assertRoutes("Discovered routes", discovered);
  const intended = assertRoutes("Proposed routes", proposed);
  const publicPaths = assertRoutes("Public allowlist", publicAllowlist);
  const unexpectedPublic = [...publicPaths].filter(path => !publicAdminRoutes.includes(path));
  if (unexpectedPublic.length > 0) {
    throw new Error("Unexpected public admin routes: " + unexpectedPublic.join(", "));
  }
  const omittedPublic = publicAdminRoutes.filter(path => !publicPaths.has(path));
  if (omittedPublic.length > 0) {
    throw new Error("Required guest recovery routes were omitted: " + omittedPublic.join(", "));
  }
  const missingPublic = [...publicPaths].filter(path => !found.has(path));
  if (missingPublic.length > 0) {
    throw new Error("Guest route is not present: " + missingPublic.join(", "));
  }
  const uncovered = [...found].filter(path => !publicPaths.has(path) && !intended.has(path));
  if (uncovered.length > 0) {
    throw new Error("Uncovered admin routes: " + uncovered.join(", "));
  }
  const stale = [...intended].filter(path => !found.has(path) || publicPaths.has(path));
  if (stale.length > 0) {
    throw new Error("Invalid or stale protected-route proposal: " + stale.join(", "));
  }
  // An inventory and a locally declared proposal cannot attest to edge setup.
  return {
    status: "PLAN_ONLY_UNVERIFIED",
    discoveredRouteCount: found.size,
    proposedProtectedRouteCount: intended.size,
    publicRouteCount: publicPaths.size,
    uncovered,
    unexpectedPublic,
    externalGates: [
      "CLOUDFLARE_POLICY_AND_ZONE_NOT_VERIFIED",
      "ORIGIN_BYPASS_NOT_VERIFIED",
      "ADMIN_RECOVERY_NOT_APPROVED",
    ],
  };
}

function routePathsUnder(directory, relativeSegments) {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      paths.push(...routePathsUnder(join(directory, entry.name), [...relativeSegments, entry.name]));
    } else if (entry.isFile() && /^(page\.(tsx|ts|jsx|js)|route\.(tsx|ts|jsx|js))$/.test(entry.name)) {
      const segments = relativeSegments.filter(segment => !/^\(.*\)$/.test(segment));
      paths.push("/" + segments.join("/"));
    }
  }
  return paths;
}

export function discoverAdminRoutes(root = appRoot) {
  if (typeof root !== "string" || !isAbsolute(root)) {
    throw new Error("A local absolute app directory is required");
  }
  const adminPages = routePathsUnder(join(root, "admin"), ["admin"]);
  const adminApi = routePathsUnder(join(root, "api", "admin"), ["api", "admin"]);
  const paths = [...adminPages, ...adminApi].sort();
  assertRoutes("Repository inventory", paths);
  return paths;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const report = auditAdminEdgeCoverage({
      discovered: discoverAdminRoutes(), proposed: proposedAdminRouteCoverage,
    });
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } catch (error) {
    process.stderr.write("AF-R013 inventory failed: " + (error instanceof Error ? error.message : "unknown") + "\n");
    process.exitCode = 1;
  }
}
