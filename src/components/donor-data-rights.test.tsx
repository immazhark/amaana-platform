import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DonorDataRights } from "./donor-data-rights";

describe("receipt-only donation information request UI", () => {
  it("discloses scope, exposes only an opt-in action and never renders private credentials", () => {
    const html = renderToStaticMarkup(<DonorDataRights
      reference="AMN-PRIVATE-RECEIPT" getToken={() => "private-token-not-for-html"}/>);
    expect(html).toContain("Questions about your donation information");
    expect(html).toContain("this donation only");
    expect(html).toContain("Request correction of information");
    expect(html).toContain("Ask for deletion or retention review");
    expect(html).toContain("Submit private review request");
    expect(html).toContain("No response deadline or deletion outcome is promised");
    expect(html).not.toContain("private-token-not-for-html");
    expect(html).not.toContain('method="post"');
  });
});
