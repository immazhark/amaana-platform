import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import ts from "typescript";

describe("donation intention validation recovery", () => {
  it("clears the intention error through the actual fieldset change handler", () => {
    const source = readFileSync(new URL("./donation-form.tsx", import.meta.url), "utf8");
    const tree = ts.createSourceFile("donation-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let handler: ts.JsxAttribute | undefined;
    function visit(node: ts.Node) {
      if (ts.isJsxOpeningElement(node) && node.tagName.getText(tree) === "fieldset" && node.getText(tree).includes('fieldError("givingIntent")')) {
        handler = node.attributes.properties.find((a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText(tree) === "onChange");
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    expect(handler, "giving intention fieldset needs change recovery").toBeDefined();
    if (!handler?.initializer || !ts.isJsxExpression(handler.initializer) || !handler.initializer.expression) throw new Error("Missing change expression");
    const code = ts.transpile(handler.initializer.expression.getText(tree), { target: ts.ScriptTarget.ES2022 });
    const clear = vi.fn();
    const change = new Function("clearFieldError", `return (${code.trim().replace(/;$/, "")});`)(clear) as () => void;
    change();
    expect(clear.mock.calls).toEqual([["givingIntent"]]);
  });
});
