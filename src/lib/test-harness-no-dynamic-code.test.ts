import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";

const allowedRoots = ["src", "scripts", "e2e"] as const;
const harnessFile = /(?:\.(?:test|spec)\.(?:[jt]sx?|[cm]js)|(?:^|\/)test-[^/]+\.mjs)$/;

function listHarnesses(directory: string): string[] {
  if (lstatSync(directory).isSymbolicLink()) {
    throw new Error("Test audit must not follow a symlinked source root");
  }
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Test audit must not follow symlinks");
    if (entry.isDirectory()) files.push(...listHarnesses(file));
    else if (entry.isFile() && harnessFile.test(file.replaceAll("\\", "/"))) files.push(file);
  }
  return files;
}

function codeGenerationSites(source: string, filename: string): string[] {
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx")
    ? ts.ScriptKind.TSX : filename.endsWith(".js") || filename.endsWith(".mjs")
      ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, kind);
  if (ast.parseDiagnostics.length > 0) throw new Error("Cannot parse audited test harness: " + filename);

  const issues: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text :
        ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) &&
        ["globalThis", "global", "window"].includes(callee.expression.text)
          ? callee.name.text : null;
      if (name === "Function" || name === "eval") {
        const position = ast.getLineAndCharacterOfPosition(node.getStart(ast));
        issues.push(`${filename}:${position.line + 1}: dynamic ${name} evaluation`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return issues;
}

describe("AF-R011 test-harness executable-code boundary", () => {
  it("recognises direct and global dynamic-code constructors without evaluating fixtures", () => {
    const malicious = [
      "const f = new Function('return 1')",
      "eval('1 + 1')",
      "globalThis.Function('return true')",
    ];
    for (const source of malicious) {
      expect(codeGenerationSites(source, "synthetic.test.ts")).toHaveLength(1);
    }
    expect(codeGenerationSites("const fn = (value: number) => value + 1", "safe.test.ts")).toEqual([]);
  });

  it("does not execute source snippets in the actual component, script, or e2e test harnesses", () => {
    const violations = allowedRoots
      .flatMap(root => listHarnesses(resolve(root)))
      .flatMap(file => codeGenerationSites(readFileSync(file, "utf8"), relative(process.cwd(), file)));
    expect(violations).toEqual([]);
  });
});
