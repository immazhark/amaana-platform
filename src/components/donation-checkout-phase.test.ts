import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/** Inspect the real requestAnimationFrame callback without executing source text. */
function hasGuardedReadyTransition(source: string): boolean {
  const tree = ts.createSourceFile("donation-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let transitions = 0;
  let cancelled = false;
  function visit(node: ts.Node) {
    const frameCallback = ts.isCallExpression(node) ? node.arguments[0] : undefined;
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "window.cancelAnimationFrame" &&
        node.arguments.length === 1 && node.arguments[0]?.getText(tree) === "frame") {
      cancelled = true;
    }
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "window.requestAnimationFrame" &&
        node.arguments.length === 1 && frameCallback && ts.isArrowFunction(frameCallback) &&
        ts.isBlock(frameCallback.body)) {
      for (const statement of frameCallback.body.statements) {
        if (!ts.isIfStatement(statement) || statement.expression.getText(tree) !== "window.Razorpay" ||
            !ts.isBlock(statement.thenStatement)) continue;
        for (const guarded of statement.thenStatement.statements) {
          if (!ts.isExpressionStatement(guarded) || !ts.isCallExpression(guarded.expression) ||
              guarded.expression.expression.getText(tree) !== "setPhase") continue;
          const updater = guarded.expression.arguments[0];
          const parameter = updater && ts.isArrowFunction(updater) ? updater.parameters[0] : undefined;
          if (!updater || !ts.isArrowFunction(updater) || updater.parameters.length !== 1 ||
              !parameter || !ts.isIdentifier(parameter.name) ||
              !ts.isConditionalExpression(updater.body)) continue;
          const current = parameter.name.text;
          const expression = updater.body;
          if (ts.isBinaryExpression(expression.condition) &&
              expression.condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
              ts.isIdentifier(expression.condition.left) && expression.condition.left.text === current &&
              ts.isStringLiteral(expression.condition.right) && expression.condition.right.text === "loading" &&
              ts.isStringLiteral(expression.whenTrue) && expression.whenTrue.text === "ready" &&
              ts.isIdentifier(expression.whenFalse) && expression.whenFalse.text === current) {
            transitions++;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return transitions === 1 && cancelled;
}

describe("delayed checkout initialization frame", () => {
  const source = readFileSync(new URL("./donation-form.tsx", import.meta.url), "utf8");

  it("advances only loading to ready when Razorpay exists and cancels its frame", () => {
    expect(hasGuardedReadyTransition(source)).toBe(true);
  });

  it("rejects a changed target state or an unguarded frame", () => {
    expect(hasGuardedReadyTransition(source.replace('"loading" ? "ready"', '"loading" ? "opening"'))).toBe(false);
    expect(hasGuardedReadyTransition(source.replace("if (window.Razorpay)", "if (true)"))).toBe(false);
  });
});
