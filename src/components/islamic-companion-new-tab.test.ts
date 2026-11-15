import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, it } from "vitest";

it("AF-R034 announces that the reminder source opens in a new tab", () => {
  const source = readFileSync(new URL("./islamic-companion.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("islamic-companion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const matches: ts.JsxElement[] = [];
  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(ast) === "a" &&
        node.openingElement.getText(ast).includes('className="amaana-reminder-source"')) {
      matches.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  expect(matches).toHaveLength(1);
  const link = matches[0]!;
  expect(link.openingElement.getText(ast)).toContain('target="_blank"');
  expect(link.openingElement.getText(ast)).toContain('rel="noopener noreferrer"');
  const disclosed = link.children.some(node => ts.isJsxElement(node) &&
    node.openingElement.tagName.getText(ast) === "span" &&
    node.openingElement.getText(ast).includes('className="sr-only"') &&
    node.children.some(t => t.getText(ast).includes("opens in a new tab")));
  expect(disclosed, "reminder reference accessible new-tab context").toBe(true);
});
