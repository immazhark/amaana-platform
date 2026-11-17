import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// AF-R012: admin permission matrix. The expected map below is the reviewable record of
// which permissions each admin page, server action and admin API reads. Any added,
// removed or changed guard fails here until the matrix (and its role consequences) is
// consciously updated. This is a static contract; runtime RBAC lives in the route tests.
const repo = join(__dirname, "..", "..");
const appRoot = join(repo, "src", "app");

const expectedMatrix: Record<string, string[]> = {
  "admin/(protected)/appeals/actions.ts": ["appeal.approve", "appeal.update"],
  "admin/(protected)/appeals/page.tsx": ["appeal.view"],
  "admin/(protected)/appeals/[id]/page.tsx": ["appeal.approve", "appeal.update", "appeal.view", "assistance.view"],
  "admin/(protected)/audit/page.tsx": ["rbac.manage"],
  "admin/(protected)/documents/[id]/route.ts": ["assistance.view"],
  "admin/(protected)/donations/actions.ts": ["donation.reconcile"],
  "admin/(protected)/donations/page.tsx": ["donation.view"],
  "admin/(protected)/donations/[id]/page.tsx": ["donation.reconcile", "donation.view"],
  "admin/(protected)/home-carousel/actions.ts": ["content.approve", "content.update"],
  "admin/(protected)/home-carousel/page.tsx": ["content.approve", "content.update"],
  "admin/(protected)/media/actions.ts": ["appeal.view", "content.approve", "content.update"],
  "admin/(protected)/media/page.tsx": ["appeal.view", "content.approve", "content.update", "content.view"],
  "admin/(protected)/notifications/actions.ts": ["notification.manage"],
  "admin/(protected)/notifications/page.tsx": ["notification.manage", "notification.view"],
  "admin/(protected)/page.tsx": ["assistance.view"],
  "admin/(protected)/requests/[id]/actions.ts": ["appeal.create", "assistance.approve", "assistance.assign", "assistance.update", "assistance.view"],
  "admin/(protected)/requests/[id]/page.tsx": ["appeal.create", "appeal.view", "assistance.approve", "assistance.assign", "assistance.update", "assistance.view"],
  "admin/(protected)/retention/actions.ts": ["assistance.approve"],
  "admin/(protected)/retention/page.tsx": ["assistance.approve"],
  "admin/(protected)/team/actions.ts": ["content.update"],
  "admin/(protected)/team/page.tsx": ["content.update"],
  "api/admin/media/curated-gallery/publish/route.ts": ["content.approve", "content.update"],
  "api/admin/media/curated-gallery/start/route.ts": ["content.approve", "content.update"],
  "api/admin/media/curated-gallery/status/route.ts": ["content.approve", "content.update"],
  "api/admin/media/curated-gallery/upload/route.ts": ["content.approve", "content.update"],
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function extractedMatrix() {
  const matrix: Record<string, string[]> = {};
  for (const root of ["admin", "api/admin"]) {
    for (const file of walk(join(appRoot, root))) {
      if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
      const text = readFileSync(file, "utf8");
      const keys = new Set<string>();
      for (const match of text.matchAll(/(?:requirePermission\(\s*|hasPermission\(\s*[\w.]+\s*,\s*)["']([a-z]+\.[a-z]+)["']/g)) keys.add(match[1]!);
      if (keys.size) matrix[relative(appRoot, file).split(sep).join("/")] = [...keys].sort();
    }
  }
  return matrix;
}

function seededRbac() {
  const seed = readFileSync(join(repo, "prisma", "seed.mjs"), "utf8");
  const block = /const permissions = \[([\s\S]*?)\n\];/.exec(seed)?.[1] ?? "";
  const permissions = [...block.matchAll(/\["([a-z]+\.[a-z]+)",/g)].map(match => match[1]!);
  const rolesBlock = /const roles = \{([\s\S]*?)\n\};/.exec(seed)?.[1] ?? "";
  const roles: Record<string, string[]> = {};
  for (const [, name, body] of rolesBlock.matchAll(/(\w+):\s*(\[[^\]]*\]|permissions\.map\([^)]*\)[^,]*)/g)) {
    roles[name!] = body!.startsWith("permissions.map") ? [...permissions] : [...body!.matchAll(/"([a-z]+\.[a-z]+)"/g)].map(match => match[1]!);
  }
  return { permissions, roles };
}

const { permissions, roles } = seededRbac();
const rolesHoldingAll = (required: string[]) =>
  Object.keys(roles).filter(role => required.every(key => roles[role]!.includes(key))).sort();

describe("AF-R012 admin permission matrix", () => {
  it("matches the reviewed per-surface permission matrix exactly", () => {
    expect(extractedMatrix()).toEqual(expectedMatrix);
  });

  it("parses the seeded RBAC definition it depends on", () => {
    expect(Object.keys(roles).sort()).toEqual(["BACKUP_APPROVER", "PRIMARY_APPROVER", "REVIEWER"]);
    expect(permissions.length).toBeGreaterThan(10);
    expect(roles.PRIMARY_APPROVER).toEqual(permissions);
  });

  it("only requires permissions that are actually seeded (no silent lock-out or typo)", () => {
    const used = new Set(Object.values(extractedMatrix()).flat());
    expect([...used].filter(key => !permissions.includes(key))).toEqual([]);
  });

  it("enforces every seeded permission somewhere (no dead grant)", () => {
    const used = new Set(Object.values(extractedMatrix()).flat());
    // rbac.manage is enforced by the audit page; appeal.create by request conversion.
    expect(permissions.filter(key => !used.has(key))).toEqual([]);
  });

  it("denies the REVIEWER every approval, reconciliation, assignment, conversion and management permission", () => {
    const privileged = permissions.filter(key => /\.(approve|reconcile|assign|create|manage)$/.test(key));
    expect(privileged.length).toBeGreaterThan(5);
    expect(roles.REVIEWER!.filter(key => privileged.includes(key))).toEqual([]);
  });

  it("limits RBAC administration (audit trail) to the primary approver", () => {
    expect(rolesHoldingAll(extractedMatrix()["admin/(protected)/audit/page.tsx"]!)).toEqual(["PRIMARY_APPROVER"]);
  });

  it.each([
    ["donation reconciliation actions", "admin/(protected)/donations/actions.ts"],
    ["notification requeue actions", "admin/(protected)/notifications/actions.ts"],
    ["retention page and actions", "admin/(protected)/retention/page.tsx"],
    ["retention actions", "admin/(protected)/retention/actions.ts"],
  ])("denies the REVIEWER %s", (_name, file) => {
    expect(rolesHoldingAll(expectedMatrix[file]!)).not.toContain("REVIEWER");
    expect(rolesHoldingAll(expectedMatrix[file]!)).toContain("PRIMARY_APPROVER");
  });

  it("denies the REVIEWER every curated-gallery admin API, which require update and approve together", () => {
    const apis = Object.entries(expectedMatrix).filter(([file]) => file.startsWith("api/admin/"));
    expect(apis.length).toBe(4);
    for (const [file, required] of apis) {
      expect(required, file).toEqual(["content.approve", "content.update"]);
      expect(rolesHoldingAll(required), file).toEqual(["BACKUP_APPROVER", "PRIMARY_APPROVER"]);
    }
  });
});
