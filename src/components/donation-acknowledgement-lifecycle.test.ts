import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/** Inspect the actual effect and its cancellation guards without executing snippets. */
function protectsAcknowledgementEffect(source: string): boolean {
  const tree = ts.createSourceFile("donation-acknowledgement-client.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let effect: ts.ArrowFunction | undefined;
  function find(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "useEffect" && node.arguments.length >= 1 &&
        ts.isArrowFunction(node.arguments[0])) effect = node.arguments[0];
    ts.forEachChild(node, find);
  }
  find(tree);
  if (!effect || !ts.isBlock(effect.body)) return false;

  let active = false;
  let guardedSuccess = false;
  let guardedFailure = false;
  let frame = false;
  let cleanup = false;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
        node.name.text === "active" && node.initializer?.kind === ts.SyntaxKind.TrueKeyword) active = true;
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "window.requestAnimationFrame") frame = true;
    if (ts.isIfStatement(node)) {
      const condition = node.expression.getText(tree);
      if (condition === "active" &&
          node.thenStatement.getText(tree).includes("setRecord(result.found ? result : null)")) guardedSuccess = true;
      if (condition === 'active && error?.name !== "AbortError"' &&
          node.thenStatement.getText(tree).includes('setRecord("error")')) guardedFailure = true;
    }
    if (ts.isReturnStatement(node) && node.expression && ts.isArrowFunction(node.expression) &&
        ts.isBlock(node.expression.body)) {
      const statements = node.expression.body.statements.map(statement => statement.getText(tree));
      if (statements.includes("active = false;") &&
          statements.includes("window.cancelAnimationFrame(frame);") &&
          statements.includes("controller?.abort();")) cleanup = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(effect.body);
  return active && frame && guardedSuccess && guardedFailure && cleanup;
}

describe("private acknowledgement response lifecycle", () => {
  const source = readFileSync(new URL("./donation-acknowledgement-client.tsx", import.meta.url), "utf8");

  it("guards successful and failed delayed responses, aborts fetch and cancels its frame on cleanup", () => {
    expect(protectsAcknowledgementEffect(source)).toBe(true);
  });

  it("detects loss of cleanup, success or error suppression", () => {
    expect(protectsAcknowledgementEffect(source.replace("active = false;", "active = true;"))).toBe(false);
    expect(protectsAcknowledgementEffect(source.replace(
      "if (active) setRecord(result.found ? result : null);",
      "setRecord(result.found ? result : null);",
    ))).toBe(false);
    expect(protectsAcknowledgementEffect(source.replace(
      'if (active && error?.name !== "AbortError")',
      'if (error?.name !== "AbortError")',
    ))).toBe(false);
  });
});
