import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, test } from "vitest";

test("AF-R034 Companion external source links announce new-tab navigation without changing visible source labels", () => {
  const source = readFileSync(new URL("./islamic-companion-panel.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("islamic-companion-panel.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const externalLinks: ts.JsxElement[] = [];

  function scan(node: ts.Node): void {
    if (ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(file) === "a" &&
        node.openingElement.getText(file).includes('target="_blank"')) {
      externalLinks.push(node);
    }
    ts.forEachChild(node, scan);
  }
  scan(file);

  expect(externalLinks, "original four source links must remain").toHaveLength(4);
  for (const link of externalLinks) {
    const opening = link.openingElement.getText(file);
    expect(opening).toContain('rel="noopener noreferrer"');
    const announcedInLabel = /aria-label=.*opens in a new tab/i.test(opening);
    const disclosure = link.children.some(child => ts.isJsxElement(child) &&
      child.openingElement.tagName.getText(file) === "span" &&
      child.openingElement.getText(file).includes('className="sr-only"') &&
      child.children.some(text => text.getText(file).includes("opens in a new tab")));
    expect(announcedInLabel || disclosure, opening).toBe(true);
  }
});
