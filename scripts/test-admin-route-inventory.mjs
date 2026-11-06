import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import ts from "typescript";

// Count direct guard calls inside exported route handlers, never decoys in
// unrelated helpers, nested function declarations, comments or quoted text.
// This remains a static inventory contract, not a runtime RBAC proof.
const routeMethods = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function exportedRouteHandlers(source) {
  const ast = ts.createSourceFile("synthetic-admin-route.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const handlers = [];
  const isExported = statement => statement.modifiers?.some(
    modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  for (const statement of ast.statements) {
    // A named re-export can expose a handler without an inspectable body.
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) throw new Error("Cannot statically audit wildcard admin API export");
      if (ts.isNamedExports(statement.exportClause)) {
        for (const name of statement.exportClause.elements) {
          if (routeMethods.has(name.name.text)) {
            throw new Error("Cannot statically audit re-exported admin API handler");
          }
        }
      }
      continue;
    }
    if (!isExported(statement)) continue;
    if (ts.isFunctionDeclaration(statement)) {
      if (statement.name && statement.body && routeMethods.has(statement.name.text)) {
        handlers.push(statement);
      }
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        throw new Error("Cannot statically audit destructured admin API export");
      }
      if (!routeMethods.has(declaration.name.text)) continue;
      let initializer = declaration.initializer;
      while (initializer && (
        ts.isParenthesizedExpression(initializer) ||
        ts.isAsExpression(initializer) ||
        ts.isSatisfiesExpression(initializer)
      )) initializer = initializer.expression;
      if (!initializer || !(ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
        throw new Error("Cannot statically audit exported admin API handler");
      }
      handlers.push({ name: declaration.name, body: initializer.body });
    }
  }
  return handlers;
}

// Only statements before a direct unconditional return/throw can satisfy
// a guard. Nested function bodies do not execute as part of the route/action.
function bodyHasReachableDirectCall(body, name) {
  let found = false;
  function visit(node) {
    if (found || ts.isFunctionLike(node)) return;
    // Nested try bodies must obey the same direct return/throw boundary as the
    // exported handler. Catch-only guards do not protect successful requests.
    if (ts.isBlock(node)) {
      for (const statement of node.statements) {
        visit(statement);
        if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) break;
      }
      return;
    }
    if (ts.isTryStatement(node)) {
      visit(node.tryBlock);
      return;
    }

    // The condition of an if/ternary is evaluated, but its alternative bodies
    // are optional. A guard confined to one branch cannot cover the handler.
    if (ts.isIfStatement(node)) {
      visit(node.expression);
      return;
    }
    if (ts.isConditionalExpression(node)) {
      visit(node.condition);
      return;
    }
    // A short-circuit RHS is also optional. Keep the always-evaluated LHS,
    // including the common if (!hasPermission(...)) denial pattern.
    if (ts.isBinaryExpression(node) && (
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    )) {
      visit(node.left);
      return;
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(body);
  return found;
}

function sourceHasGuardCall(source, name, method) {
  for (const handler of exportedRouteHandlers(source)) {
    if (method && handler.name.text !== method) continue;
    if (bodyHasReachableDirectCall(handler.body, name)) return true;
  }
  return false;
}

// Shared synthetic and inventory check; preserve its current behavior for RED.
function actionHasPermissionGuard(body) {
  return bodyHasReachableDirectCall(body, "requirePermission");
}

test("AF-R012 ignores permission calls hidden in never-invoked server-action helpers", () => {
  const examples = [
    ["nested function", "function unused() { requirePermission('appeals.update'); }"],
    ["arrow callback", "const unused = () => requirePermission('appeals.update');"],
    ["async callback", "const unused = async () => { await requirePermission('appeals.update'); };"],
    ["object method", "const unused = { check() { return requirePermission('appeals.update'); } };"],
  ];
  for (const [label, hidden] of examples) {
    const source = `export async function save() { ${hidden} return "unguarded"; }`;
    const ast = ts.createSourceFile("synthetic-action.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const action = ast.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name?.text === "save");
    assert.ok(action?.body, label);
    assert.equal(actionHasPermissionGuard(action.body), false, `${label} must not satisfy action permission inventory`);
  }

  const direct = ts.createSourceFile("direct-action.ts",
    "export async function save() { await requirePermission('appeals.update'); }",
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const action = direct.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name?.text === "save");
  assert.ok(action?.body);
  assert.equal(actionHasPermissionGuard(action.body), true, "An action's direct guard must remain detectable");
});

// Audit every directly exported async server action, not only declarations.
// Never count unexported helpers or synchronous callbacks as server actions.
function exportedAsyncProtectedActions(sourceFile) {
  const actions = [];
  const hasModifier = (node, kind) => node.modifiers?.some(modifier => modifier.kind === kind);
  for (const statement of sourceFile.statements) {
    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(statement)) {
      if (statement.name && statement.body && hasModifier(statement, ts.SyntaxKind.AsyncKeyword)) {
        actions.push({ name: statement.name.text, body: statement.body });
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        if (ts.isIdentifier(declaration.name) && initializer &&
            (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) &&
            hasModifier(initializer, ts.SyntaxKind.AsyncKeyword)) {
          actions.push({ name: declaration.name.text, body: initializer.body });
        }
      }
    }
  }
  return actions;
}

test("AF-R012 detects exported async arrow and function-expression server actions", () => {
  const source = [
    "'use server';",
    "const privateHelper = async () => { await requirePermission('private'); };",
    "export const syncValue = () => requirePermission('not-an-action');",
    "export const guardedArrow = async () => { await requirePermission('team.manage'); };",
    "export const unguardedArrow = async (id) => id;",
    "export const guardedExpression = async function () { await requirePermission('media.manage'); };",
    "export async function guardedDeclaration() { await requirePermission('team.manage'); }",
  ].join("\n");
  const ast = ts.createSourceFile("synthetic-server-actions.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const actions = exportedAsyncProtectedActions(ast);
  assert.deepEqual(actions.map(action => action.name), [
    "guardedArrow", "unguardedArrow", "guardedExpression", "guardedDeclaration",
  ], "Every exported async action form must be included in the permission audit");
  assert.deepEqual(actions.map(action => actionHasPermissionGuard(action.body)), [
    true, false, true, true,
  ], "An unguarded async arrow must fail its own permission check, not vanish from inventory");
});

test("AF-R012 inventories variable-exported admin API handlers, even if unguarded", () => {
  const source = [
    "const privateHelper = () => getCurrentUser();",
    "export async function GET() { await getCurrentUser(); hasPermission({}, 'content.read'); }",
    "export const POST = async () => Response.json({ public: true });",
    "export const PATCH = async function () { await getCurrentUser(); hasPermission({}, 'content.update'); isSameOrigin({}); };",
    "export const DELETE = () => Response.json({ public: true });",
    "const privateOPTIONS = async () => Response.json({ public: true });",
    "export const unknownMETHOD = () => Response.json({ public: true });",
  ].join("\n");
  assert.deepEqual(exportedRouteHandlers(source).map(handler => handler.name.text),
    ["GET", "POST", "PATCH", "DELETE"],
    "Every exported function-style HTTP handler must be audited; private and unknown methods must not count");
  assert.equal(sourceHasGuardCall(source, "getCurrentUser", "POST"), false,
    "An unguarded exported POST must fail its own authentication check");
  assert.equal(sourceHasGuardCall(source, "isSameOrigin", "PATCH"), true,
    "A guarded exported function expression must retain its direct origin check");
  assert.equal(sourceHasGuardCall(source, "isSameOrigin", "DELETE"), false,
    "An unguarded synchronous DELETE must fail its own origin check");
});

test("AF-R012 rejects uninspectable exported admin HTTP aliases and supports wrapped functions", () => {
  for (const source of [
    "export const POST = wrapper(async () => Response.json({ ok: true }));",
    "const POST = async () => Response.json({ ok: true }); export { POST };",
    "export { POST } from './shared-route';",
    "export * from './shared-route';",
    "export const { GET } = helper;",
  ]) assert.throws(() => exportedRouteHandlers(source), /Cannot statically audit/);

  const wrapped = [
    "export const POST = ((async () => { await getCurrentUser(); isSameOrigin({}); }))",
    "  satisfies (...args: unknown[]) => Promise<unknown>;",
  ].join("\n");
  assert.deepEqual(exportedRouteHandlers(wrapped).map(handler => handler.name.text), ["POST"]);
  assert.equal(sourceHasGuardCall(wrapped, "getCurrentUser", "POST"), true);
  assert.equal(sourceHasGuardCall(wrapped, "isSameOrigin", "POST"), true);
});

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
  assert.equal(sourceHasGuardCall("export async function GET() { await getCurrentUser(); }", "getCurrentUser"), true);
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

test("AF-R012 ignores admin guards after an unconditional exit", () => {
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    const unguarded = `export async function ${method}() {
      return Response.json({ accessible: true });
      await getCurrentUser();
      hasPermission({}, 'content.update');
      isSameOrigin({});
    }`;
    for (const name of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
      assert.equal(sourceHasGuardCall(unguarded, name, method), false,
        `${method}: unreachable ${name}() cannot satisfy an admin API guard`);
    }
  }

  const action = ts.createSourceFile("unreachable-admin-action.ts", [
    "'use server';",
    "export async function unsafeSave() {",
    "  throw new Error('exit');",
    "  await requirePermission('team.manage');",
    "}",
  ].join("\n"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const unsafeSave = exportedAsyncProtectedActions(action).find(item => item.name === "unsafeSave");
  assert.ok(unsafeSave, "must find the real exported action");
  assert.equal(actionHasPermissionGuard(unsafeSave.body), false,
    "Permission calls after unconditional throw must not pass action inventory");

  assert.equal(sourceHasGuardCall(
    "export async function PATCH() { await getCurrentUser(); return Response.json({}); }",
    "getCurrentUser", "PATCH"), true, "A guard before exit must remain detectable");
});

test("AF-R012 rejects optional-branch-only admin guards", () => {
  const guards = [
    "await getCurrentUser();",
    "hasPermission({}, 'content.update');",
    "isSameOrigin({});",
  ].join(" ");
  for (const conditional of [
    `if (false) { ${guards} }`,
    `if (allowWithoutGuarantee) { ${guards} }`,
  ]) {
    const source = `export async function POST() { ${conditional} return Response.json({ public: true }); }`;
    for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
      assert.equal(sourceHasGuardCall(source, guard, "POST"), false,
        `${guard}: conditional branch guard cannot authorize the whole POST handler`);
    }
  }

  const conditionalExpression =
    "export async function PATCH() { const allowed = flag ? hasPermission({}, 'content.update') : false; return Response.json({ allowed }); }";
  assert.equal(sourceHasGuardCall(conditionalExpression, "hasPermission", "PATCH"), false,
    "A ternary branch does not guarantee a permission check");

  const shortCircuit =
    "export async function DELETE() { flag && isSameOrigin({}); return Response.json({ public: true }); }";
  assert.equal(sourceHasGuardCall(shortCircuit, "isSameOrigin", "DELETE"), false,
    "A short-circuited guard cannot authorize the full mutation");

  const actionSource = [
    "'use server';",
    "export async function update() { if (flag) { await requirePermission('team.manage'); } return 'unguarded'; }",
  ].join("\n");
  const actionAst = ts.createSourceFile("conditional-action.ts", actionSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const action = exportedAsyncProtectedActions(actionAst).find(item => item.name === "update");
  assert.ok(action);
  assert.equal(actionHasPermissionGuard(action.body), false,
    "An optional branch's permission call cannot guard an exported server action");

  const predicate = [
    "export async function POST(request) {",
    "  if (!isSameOrigin(request)) return Response.json({ error: 'origin' });",
    "  const user = await getCurrentUser();",
    "  if (!hasPermission(user, 'content.update')) return Response.json({ error: 'access' });",
    "  return Response.json({ ok: true });",
    "}",
  ].join("\n");
  for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
    assert.equal(sourceHasGuardCall(predicate, guard, "POST"), true,
      `${guard}: direct required predicate or assignment must still count`);
  }
});

test("AF-R012 rejects unreachable try-block and catch-only admin guards", () => {
  for (const method of ["GET", "POST", "PATCH"]) {
    const unreachable = `export async function ${method}() {
      try {
        return Response.json({ unguarded: true });
        await getCurrentUser(); hasPermission({}, 'content.update'); isSameOrigin({});
      } catch { return Response.json({ fallback: true }); }
    }`;
    for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
      assert.equal(sourceHasGuardCall(unreachable, guard, method), false,
        `${method}: ${guard} after return in try cannot protect an API request`);
    }
  }

  const catchOnly = [
    "export async function POST() {",
    " try { return Response.json({ unguarded: true }); }",
    " catch { await getCurrentUser(); hasPermission({}, 'content.update'); isSameOrigin({}); }",
    "}",
  ].join("\n");
  for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
    assert.equal(sourceHasGuardCall(catchOnly, guard, "POST"), false,
      `catch-only ${guard} does not protect successful POST requests`);
  }

  const action = ts.createSourceFile("try-exit-admin-action.ts", [
    "'use server';",
    "export async function update() {",
    "  try { throw new Error('denied'); await requirePermission('team.manage'); }",
    "  catch { return 'unguarded'; }",
    "}",
  ].join("\n"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const exported = exportedAsyncProtectedActions(action).find(item => item.name === "update");
  assert.ok(exported);
  assert.equal(actionHasPermissionGuard(exported.body), false,
    "Permission after a throw in try cannot authorize a server action");

  const guarded = [
    "export async function POST(request) {",
    "  try {",
    "    if (!isSameOrigin(request)) return Response.json({ status: 403 });",
    "    const user = await getCurrentUser();",
    "    if (!hasPermission(user, 'content.update')) return Response.json({ status: 403 });",
    "    return Response.json({ ok: true });",
    "  } catch { return Response.json({ error: true }); }",
    "}",
  ].join("\n");
  for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
    assert.equal(sourceHasGuardCall(guarded, guard, "POST"), true,
      `required ${guard} in a real try-block guard must still pass`);
  }
});

test("AF-R012 ignores optional loop bodies and switch-case permission decoys", () => {
  const guards = [
    "await getCurrentUser();",
    "hasPermission({}, 'content.update');",
    "isSameOrigin({});",
  ].join(" ");
  const cases = [
    ["while body", `while (false) { ${guards} }`],
    ["for body", `for (let i = 0; i < 0; i++) { ${guards} }`],
    ["for of body", `for (const item of []) { ${guards} }`],
    ["for in body", `for (const key in {}) { ${guards} }`],
    ["switch case", `switch (kind) { case "approved": { ${guards} break; } default: break; }`],
  ];
  for (const [label, conditional] of cases) {
    const source = `export async function POST() { ${conditional} return Response.json({ unguarded: true }); }`;
    for (const guard of ["getCurrentUser", "hasPermission", "isSameOrigin"]) {
      assert.equal(sourceHasGuardCall(source, guard, "POST"), false,
        `${label}: ${guard} inside an optional path is not an unconditional API guard`);
    }
  }

  const actionSource = ts.createSourceFile("optional-loop-action.ts", [
    "'use server';",
    "export async function update() {",
    "  for (const item of []) { await requirePermission('team.manage'); }",
    "  return 'unguarded';",
    "}",
  ].join("\n"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const action = exportedAsyncProtectedActions(actionSource).find(item => item.name === "update");
  assert.ok(action);
  assert.equal(actionHasPermissionGuard(action.body), false,
    "Loop-only permission call does not protect a server action");

  const evaluated = [
    ["while condition", "export async function GET() { while (await getCurrentUser()) { break; } }",
      "getCurrentUser", "GET"],
    ["for condition", "export async function POST() { for (; isSameOrigin({});) { break; } }",
      "isSameOrigin", "POST"],
    ["switch selector", "export async function GET() { switch (await getCurrentUser()) { default: break; } }",
      "getCurrentUser", "GET"],
  ];
  for (const [label, source, guard, method] of evaluated) {
    assert.equal(sourceHasGuardCall(source, guard, method), true,
      `${label}: an evaluated predicate must remain auditable`);
  }
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
    const handlers = exportedRouteHandlers(source);
    assert.ok(handlers.length > 0, `${route}: an exported HTTP handler is required`);
    assert.match(source, /no-store/, `${route}: private cache policy required`);
    for (const handler of handlers) {
      const method = handler.name.text;
      assert.ok(sourceHasGuardCall(source, "getCurrentUser", method),
        `${route}:${method} must independently authenticate`);
      assert.ok(sourceHasGuardCall(source, "hasPermission", method),
        `${route}:${method} must independently check permission`);
      if (mutatingMethods.has(method)) {
        assert.ok(sourceHasGuardCall(source, "isSameOrigin", method),
          `${route}:${method} must reject cross-origin mutations`);
      }
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

    for (const action of exportedAsyncProtectedActions(sourceFile)) {
      exportedActionCount += 1;
      assert.ok(
        actionHasPermissionGuard(action.body),
        `${path}:${action.name} must independently call requirePermission()`,
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
