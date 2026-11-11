import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * AF-R001: upstream Next.js security release published on 3 November 2026,
 * followed by the 16.4.6 stable regression patch on 9 November.
 * Every production installation must use a compatible pinned build and SWC.
 */
describe("AF-R001 Next.js supported security baseline", () => {
  it("pins the November security-patched stable line consistently through npm ci", () => {
    const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const lock = JSON.parse(readFileSync(resolve("package-lock.json"), "utf8")) as {
      packages: Record<string, { version?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; optionalDependencies?: Record<string, string> }>;
    };
    const version = manifest.dependencies.next;
    expect(typeof version).toBe("string");
    if (!version) throw new Error("Next.js dependency is not declared");
    const parsed = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    expect(parsed, "Use an exact version, not a semver range").not.toBeNull();
    if (!parsed) throw new Error("Next.js version must be an exact semantic version");
    const major = Number(parsed[1]);
    const minor = Number(parsed[2]);
    const patch = Number(parsed[3]);
    expect(
      major > 16 || (major === 16 && (minor > 4 || (minor === 4 && patch >= 6))),
      "Next.js 16.4.2 predates the seven November 2026 security fixes; use 16.4.6 or a later supported stable release",
    ).toBe(true);

    expect(manifest.devDependencies["eslint-config-next"]).toBe(version);
    expect(lock.packages[""]?.dependencies?.next).toBe(version);
    expect(lock.packages[""]?.devDependencies?.["eslint-config-next"]).toBe(version);
    expect(lock.packages["node_modules/next"]?.version).toBe(version);
    expect(lock.packages["node_modules/eslint-config-next"]?.version).toBe(version);
    expect(lock.packages["node_modules/@next/env"]?.version).toBe(version);
    expect(lock.packages["node_modules/@next/eslint-plugin-next"]?.version).toBe(version);

    const swc = lock.packages["node_modules/next"]?.optionalDependencies ?? {};
    for (const [name, declared] of Object.entries(swc)) {
      if (!name.startsWith("@next/swc-")) continue;
      expect(declared).toBe(version);
      expect(lock.packages[`node_modules/${name}`]?.version).toBe(version);
    }
  });
});
