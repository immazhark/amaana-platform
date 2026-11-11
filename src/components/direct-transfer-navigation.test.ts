import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/** Prove that the real async submit handler guards its one private navigation. */
function guardsDirectTransferNavigation(source: string): boolean {
  const tree = ts.createSourceFile("direct-transfer-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let submit: ts.FunctionDeclaration | undefined;
  function find(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "submit") submit = node;
    ts.forEachChild(node, find);
  }
  find(tree);
  if (!submit?.body || !submit.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) return false;

  let pushes = 0;
  let guarded = 0;
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === "router.push") pushes++;
    if (ts.isIfStatement(node) && node.expression.getText(tree) === "form.isConnected" &&
        ts.isExpressionStatement(node.thenStatement) && ts.isCallExpression(node.thenStatement.expression)) {
      const call = node.thenStatement.expression;
      if (call.expression.getText(tree) === "router.push" &&
          call.arguments.length === 1 &&
          call.arguments[0]?.getText(tree) ===
            "privateDonationAcknowledgementPath(result.referenceNumber, result.receiptToken)" &&
          node.getStart(tree) > source.indexOf('result.status !== "PENDING_VERIFICATION"')) {
        guarded++;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(submit.body);
  return pushes === 1 && guarded === 1;
}

describe("direct transfer late navigation", () => {
  const source = readFileSync(new URL("./direct-transfer-form.tsx", import.meta.url), "utf8");

  it("navigates after accepted pending verification only if the original form remains connected", () => {
    expect(guardsDirectTransferNavigation(source)).toBe(true);
  });

  it("rejects unconditional navigation and a changed acknowledgement destination", () => {
    expect(guardsDirectTransferNavigation(source.replace(
      "if (form.isConnected) router.push(", "router.push(",
    ))).toBe(false);
    expect(guardsDirectTransferNavigation(source.replace(
      "privateDonationAcknowledgementPath(result.referenceNumber, result.receiptToken)",
      '"/unsafe"',
    ))).toBe(false);
  });
});
