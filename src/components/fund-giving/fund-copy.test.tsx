import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { donationFormCopy } from "@/components/donation-form-copy";
import { fundDonationFormCopy } from "./fund-copy";

describe("direct transfer guidance matches the donation destination", () => {
  const methods = ["upiHeading", "bankHeading"] as const;

  it.each(methods)("retains appeal-specific guidance for %s", method => {
    const html = renderToStaticMarkup(<>{donationFormCopy(false).direct[method]}</>);
    expect(html).toContain("Your appeal total changes only after verification.");
  });

  it.each(methods)("does not refer to an appeal for designated funds and Taleem via %s", method => {
    for (const slug of ["general", "taleem"]) {
      const copy = fundDonationFormCopy({
        slug, name: "Synthetic fund", summary: "Synthetic test fixture",
        zakatPolicy: "ACCEPTED", isGeneral: slug === "general",
      });
      const html = renderToStaticMarkup(<>{copy.direct[method]}</>);
      expect(html).not.toMatch(/\bappeal\b/i);
      expect(html).toContain("UTR/reference");
      expect(html).toContain("Your contribution is recorded as verified only after Amaana matches the transfer to funds received.");
    }
  });
});
