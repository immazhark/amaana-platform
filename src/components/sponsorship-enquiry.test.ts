import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { SponsorshipEnquiry } from "./sponsorship-enquiry";
it("renders a native fixed-category form without sending a message or collecting identity", () => {
  const html = renderToStaticMarkup(createElement(SponsorshipEnquiry, { preferences: {} }));
  expect(html).toContain('method="get"');
  expect(html).toContain('name="path"');
  expect(html).toContain('name="support"');
  expect(html).toContain('type="checkbox"');
  expect(html).not.toContain('type="email"');
  expect(html).not.toContain('Open email with these preferences');
});
it("renders an honest review with contact fallback and protected recognition preference", () => {
  const html = renderToStaticMarkup(createElement(SponsorshipEnquiry, { preferences: { path: "school", support: "ongoing", privateName: "yes" } }));
  expect(html).toContain("School education (developing pathway)");
  expect(html).toContain("each contribution decided separately");
  expect(html).toContain("Nothing has been sent");
  expect(html).toContain("copy the message above");
  expect(html).toContain("mailto:amaanafoundation24@gmail.com?");
  expect(html).toContain("financial and receipt records may still require my details");
});
it("does not reflect unsupported query values or personal records", () => {
  const html = renderToStaticMarkup(createElement(SponsorshipEnquiry, { preferences: { path: ["school", "hifdh"], support: "once", student: "PRIVATE_STUDENT" } }));
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("PRIVATE_STUDENT");
  expect(html).not.toContain("Open email with these preferences");
});
