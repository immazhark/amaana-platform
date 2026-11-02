import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const accessibilityRules = [
  "jsx-a11y/alt-text",
  "jsx-a11y/aria-props",
  "jsx-a11y/aria-proptypes",
  "jsx-a11y/aria-unsupported-elements",
  "jsx-a11y/role-has-required-aria-props",
  "jsx-a11y/role-supports-aria-props",
  "jsx-a11y/anchor-is-valid",
  "jsx-a11y/click-events-have-key-events",
  "jsx-a11y/no-static-element-interactions",
  "jsx-a11y/tabindex-no-positive",
];

describe("source lint enforcement", () => {
  it("enforces accessibility and cycle rules for source TSX", async () => {
    const eslint = new ESLint();
    for (const path of ["src/components/appeal-share.tsx", "src/app/team/page.tsx"]) {
      const config = await eslint.calculateConfigForFile(path);
      expect(config?.rules?.["import/no-cycle"]?.[0], `${path}: import/no-cycle`).toBe(2);
      for (const rule of accessibilityRules) {
        expect(config?.rules?.[rule]?.[0], `${path}: ${rule}`).toBe(2);
      }
    }
  });

  it("rejects a synthetic inaccessible image with error severity", async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(
      'export function ImageProbe() { return <img src="/synthetic.png" />; }',
      { filePath: "src/components/__lint_accessibility_probe__.tsx" },
    );
    if (!result) throw new Error("ESLint omitted the synthetic accessibility result");
    expect(result.messages.some(message => message.ruleId === "jsx-a11y/alt-text" && message.severity === 2))
      .toBe(true);
  });

  it("rejects invalid anchors, pointer-only controls and positive tab order", async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText(
      'export function InteractionProbe() { return <><a href="#">Broken</a><div onClick={() => undefined}>Action</div><button tabIndex={2}>Next</button></>; }',
      { filePath: "src/components/__lint_interaction_probe__.tsx" },
    );
    if (!result) throw new Error("ESLint omitted the synthetic interaction result");
    for (const rule of ["jsx-a11y/anchor-is-valid", "jsx-a11y/click-events-have-key-events", "jsx-a11y/no-static-element-interactions", "jsx-a11y/tabindex-no-positive"]) {
      expect(result.messages.some(message => message.ruleId === rule && message.severity === 2), rule)
        .toBe(true);
    }
  });

  it("rejects a synthetic circular source import with error severity", async () => {
    const fixture = await mkdtemp(join(process.cwd(), "src", "__lint_cycle_probe_"));
    try {
      const first = join(fixture, "first.ts");
      const second = join(fixture, "second.ts");
      const aliasFirst = join(fixture, "alias-first.ts");
      const aliasSecond = join(fixture, "alias-second.ts");
      await writeFile(first, 'import { second } from "./second";\nexport const first = second;\n');
      await writeFile(second, 'import { first } from "./first";\nexport const second = first;\n');
      await writeFile(aliasFirst, `import { aliasSecond } from "@/${basename(fixture)}/alias-second";\nexport const aliasFirst = aliasSecond;\n`);
      await writeFile(aliasSecond, 'import { aliasFirst } from "./alias-first";\nexport const aliasSecond = aliasFirst;\n');

      const eslint = new ESLint();
      const results = await eslint.lintFiles([first, second, aliasFirst, aliasSecond]);
      for (const path of [first, aliasFirst]) {
        const result = results.find(entry => entry.filePath === path);
        expect(result, `Missing lint result: ${path}`).toBeDefined();
        expect(result?.messages.some(message => message.ruleId === "import/no-cycle" && message.severity === 2),
          `Missing circular import error: ${path}`).toBe(true);
      }
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
});
