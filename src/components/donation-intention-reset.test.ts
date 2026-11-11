import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/** Resolve the JSX handler via TypeScript AST; never transpile and execute source. */
function intentionRecoveryField(source: string): string | null {
  const tree = ts.createSourceFile("donation-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let recovery: string | null = null;
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(tree) === "fieldset" &&
        node.getText(tree).includes('fieldError("givingIntent")')) {
      const handler = node.attributes.properties.find(
        (attribute): attribute is ts.JsxAttribute =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === "onChange",
      );
      const initializer = handler?.initializer;
      if (initializer && ts.isJsxExpression(initializer) && initializer.expression &&
          ts.isArrowFunction(initializer.expression) && initializer.expression.parameters.length === 0 &&
          ts.isCallExpression(initializer.expression.body)) {
        const call = initializer.expression.body;
        if (ts.isIdentifier(call.expression) && call.expression.text === "clearFieldError" &&
            call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0])) {
          recovery = call.arguments[0].text;
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return recovery;
}

describe("donation intention validation recovery", () => {
  const source = readFileSync(new URL("./donation-form.tsx", import.meta.url), "utf8");

  it("clears only the giving intention error through the fieldset change handler", () => {
    expect(intentionRecoveryField(source)).toBe("givingIntent");
  });

  it("detects a missing handler and a handler clearing the wrong field", () => {
    expect(intentionRecoveryField(source.replace(
      'onChange={() => clearFieldError("givingIntent")}',
      'onChange={() => clearFieldError("amount")}',
    ))).toBe("amount");
    expect(intentionRecoveryField(source.replace(
      'onChange={() => clearFieldError("givingIntent")}',
      'onChange={() => {}}',
    ))).toBeNull();
  });
});
