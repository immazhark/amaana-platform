import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const formCss = readFileSync(new URL("../app/forms-experience.css", import.meta.url), "utf8");
const donationCss = readFileSync(new URL("./donation-form.module.css", import.meta.url), "utf8");
const detail = readFileSync(new URL("../app/appeals/[slug]/page.tsx", import.meta.url), "utf8");
const copy = readFileSync(new URL("./donation-form-copy.tsx", import.meta.url), "utf8");

test("shared donor text fields exclude radio inputs before layout inheritance", () => {
  expect(formCss).not.toContain("input:not([type=checkbox]):not([type=file])");
  expect(formCss).toContain("input:not([type=checkbox]):not([type=radio]):not([type=file])");
});
test("nested checkout focus is visible only around the outer control", () => {
  expect(donationCss).toMatch(/checkoutControl[^\n]*input:focus-visible/);
});
test("direct giving intention uses the audited compact radio card layout", () => {
  expect(copy).not.toContain('<label className="checkbox" key={intent}><input type="radio"');
});
test("funding card uses page-specific responsive styling", () => {
  expect(detail).toContain("fundingPanel");
});
