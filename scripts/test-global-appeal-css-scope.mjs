import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("AF-R057 appeal card CSS is owned by the component rather than every root route", () => {
  const layout = source("src/app/layout.tsx");
  const component = source("src/components/appeal-card.tsx");
  assert.doesNotMatch(layout, /import\s+["']\.\/appeal-card\.css["'];?/,
    "Every route currently inherits an appeal-only stylesheet");
  assert.match(component, /import\s+["']@\/app\/appeal-card\.css["'];?/,
    "AppealCard must explicitly own its CSS so public routes without cards can omit it");
});

test("AF-R057 component CSS preserves the final shared card theme after relocation", () => {
  const css = source("src/app/appeal-card.css");
  const lastCard = css.lastIndexOf(".v2-appeal-card{");
  const theme = css.indexOf("border-radius:var(--af-card-radius)", lastCard);
  assert.ok(theme > lastCard, "Route-scoped card CSS must preserve the shared radius token");
  assert.ok(css.indexOf("box-shadow:var(--af-card-shadow)", lastCard) > lastCard,
    "Route-scoped card CSS must preserve the shared shadow token");
  assert.ok(css.indexOf("background:rgb(255 253 248 / 88%)", lastCard) > lastCard,
    "Route-scoped card CSS must preserve the shared card surface");
});
