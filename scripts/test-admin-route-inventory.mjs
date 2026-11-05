import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import ts from "typescript";

// Count actual direct guard calls, not identifiers in comments, quoted text,
// or member access. This is a static inventory contract, not a runtime RBAC proof.
function sourceHasGuardCall(source, name) {
  const ast = ts.createSourceFile("synthetic-admin-route.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found = false;
  function visit(node) {
    if (found) return;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return found;
}

test("AF-R012 rejects commented or quoted admin API guard decoys", () => {
  const source = [
    "// getCurrentUser()",
    "/* hasPermission() */",
    'const explanatoryText = "isSameOrigin()";',
    "export async function POST() { return Response.json({ public: true }); }",
  ].join("\n");
  for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
    assert.equal(sourceHasGuardCall(source, guard), false, guard + " must be an actual call");
  }
  assert.equal(sourceHasGuardCall("async function GET() { await getCurrentUser(); }", "getCurrentUser"), true);
});

test("AF-R012 requires real guards inside the exported admin handler, not unused helpers", () => {
  const deceptive = [
    "async function unusedGuards() {",
    "  await getCurrentUser(); hasPermission({}, 'content.update'); isSameOrigin({});",
    "}",
    "export async function POST() { return Response.json({ public: true }); }",
  ].join("\n");
  for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
    assert.equal(sourceHasGuardCall(deceptive, guard), false,
      guard + " must be called from an exported route handler");
  }
  const wrongMethod = [
    "export async function GET() { isSameOrigin({}); }",
    "export async function POST() { return Response.json({ public: true }); }",
  ].join("\n");
  assert.equal(sourceHasGuardCall(wrongMethod, "isSameOrigin", "POST"), false,
    "GET guard must not satisfy the POST mutation contract");
  assert.equal(sourceHasGuardCall(
    "export async function POST() { const user = await getCurrentUser(); return user; }",
    "getCurrentUser", "POST"), true);
});

const root = process.cwd();
const browserContract = readFileSync(join(root, "e2e/admin-anonymous-boundaries.spec.mjs"), "utf8");

function walk(directory) {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() ? [relative(root, join(root, path)).split(sep).join("/")] : [];
  });
}

test("every protected admin page has an anonymous redirect acceptance case", () => {
  const pages = walk("src/app/admin/(protected)")
    .filter(path => path.endsWith("/page.tsx"));
  assert.ok(pages.length >= 10, "unexpectedly small protected admin route inventory");
  for (const page of pages) {
    const publicPath = page
      .replace(/^src\/app\/admin\/\(protected\)/, "/admin")
      .replace(/\/page\.tsx$/, "")
      .replace(/\[id\]/g, "not-a-real-id");
    assert.ok(browserContract.includes(JSON.stringify(publicPath)),
      `Anonymous admin browser test does not cover: ${publicPath}`);
  }
});

test("every admin API has fail-closed guards and anonymous request coverage", () => {
  const routes = walk("src/app/api/admin").filter(path => path.endsWith("/route.ts"));
  assert.ok(routes.length >= 4, "unexpectedly small admin API inventory");
  for (const route of routes) {
    const url = route.replace(/^src\/app/, "").replace(/\/route\.ts$/, "");
    assert.ok(browserContract.includes(JSON.stringify(url)),
      `Anonymous API browser test does not cover: ${url}`);
    const source = readFileSync(join(root, route), "utf8");
    assert.ok(sourceHasGuardCall(source, "getCurrentUser"), `${route}: explicit authentication required`);
    assert.ok(sourceHasGuardCall(source, "hasPermission"), `${route}: explicit permission check required`);
    assert.match(source, /no-store/, `${route}: private cache policy required`);
    if (/export async function POST\s*\(/.test(source)) {
      assert.ok(sourceHasGuardCall(source, "isSameOrigin"), `${route}: cross-origin mutations must be rejected`);
    }
  }
});


test("every protected admin server action independently requires permission", () => {
  const actionFiles = walk("src/app/admin/(protected)")
    .filter(path => path.endsWith("/actions.ts"));
  assert.ok(actionFiles.length >= 7, "unexpectedly small protected admin action inventory");

  let exportedActionCount = 0;
  for (const path of actionFiles) {
    const source = readFileSync(join(root, path), "utf8");
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    for (const statement of sourceFile.statements) {
      if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body) continue;
      const modifiers = statement.modifiers ?? [];
      const isExported = modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
      const isAsync = modifiers.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
      if (!isExported || !isAsync) continue;

      exportedActionCount += 1;
      let permissionGuardFound = false;
      const visit = node => {
        if (permissionGuardFound) return;
        if (
          ts.isCallExpression(node)
          && ts.isIdentifier(node.expression)
          && node.expression.text === "requirePermission"
        ) {
          permissionGuardFound = true;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(statement.body);

      assert.ok(
        permissionGuardFound,
        `${path}:${statement.name.text} must independently call requirePermission()`,
      );
    }
  }

  assert.ok(exportedActionCount >= 19, "unexpectedly small protected admin server-action inventory");
});

test("protected financial amount controls retain accessible numeric entry without spinners", () => {
  const expectations = [
    ["src/app/admin/(protected)/appeals/[id]/page.tsx", ["goalAmount"]],
    ["src/app/admin/(protected)/requests/[id]/page.tsx", ["verifiedNeedAmount", "approvedPublicTarget"]],
  ];
  for (const [path, fields] of expectations) {
    const source = readFileSync(join(root, path), "utf8");
    for (const name of fields) {
      const tag = source.match(new RegExp('<input\\s+[^>]*name="' + name + '"[^>]*>'))?.[0];
      assert.ok(tag, `${path} missing ${name}`);
      assert.match(tag, /type="text"/, `${name} must not use spinbuttons`);
      assert.match(tag, /inputMode="decimal"/, `${name} must request a numeric keyboard`);
      assert.match(tag, /pattern="/, `${name} must have a native validity pattern`);
    }
  }
});
