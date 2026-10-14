import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedbackEnquiryBuilder } from "./feedback-enquiry-builder";

describe("voluntary feedback surface", () => {
  it("keeps complaints distinct, exposes a private contact action and no site-side upload", () => {
    const html = renderToStaticMarkup(<FeedbackEnquiryBuilder />);
    expect(html).toContain("Concern or complaint");
    expect(html).toContain("Suggestion or improvement");
    expect(html).toContain("Private appreciation");
    expect((html.match(/type="radio"/g) ?? [])).toHaveLength(3);
    expect(html).toContain('name="feedback-kind"');
    expect(html).toContain("mailto:amaanafoundation24@gmail.com?");
    expect(html).toContain("You must review and send the email yourself.");
    expect(html).toContain("never permission to publish");
    expect(html).not.toContain('action="/api/');
  });
  it("limits free-text input without splitting emoji or creating hidden uploads", () => {
    const html = renderToStaticMarkup(<FeedbackEnquiryBuilder />);
    expect(html).toContain('maxLength="480"');
    expect(html).toContain("non-sensitive information only");
    expect(html).not.toContain('type="file"');
  });
});
