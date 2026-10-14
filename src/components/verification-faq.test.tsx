import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VerificationFaq } from "./verification-faq";
import { VERIFICATION_FAQ, buildVerificationFaqSchema, serializeVerificationFaqSchema } from "@/lib/verification-faq";

describe("visible Amaana verification questions and FAQ markup", () => {
  it("keeps every structured answer identical to the visible published answer", () => {
    const html = renderToStaticMarkup(<VerificationFaq />);
    const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    expect(json).toBeDefined();
    const schema = JSON.parse(json!);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(VERIFICATION_FAQ.length);
    for (const [index, item] of VERIFICATION_FAQ.entries()) {
      expect(schema.mainEntity[index].name).toBe(item.question);
      expect(schema.mainEntity[index].acceptedAnswer.text).toBe(item.answer);
      expect(html).toContain(item.question.replaceAll("'", "&#x27;"));
      expect(html).toContain(item.answer.replaceAll("'", "&#x27;"));
    }
  });

  it("preserves privacy, non-FCRA and provisional tax-status distinctions", () => {
    const copy = VERIFICATION_FAQ.map(i => i.answer).join(" ");
    expect(copy).toContain("not FCRA-registered");
    expect(copy).toContain("provisional");
    expect(copy).toContain("not a statutory Form 10BE certificate");
    expect(copy).toContain("outside the public website");
  });

  it("publishes only a safe same-site /how-we-verify JSON-LD FAQ identity", () => {
    const schema = buildVerificationFaqSchema("https://amaanafoundation.org");
    expect(schema.url).toBe("https://amaanafoundation.org/how-we-verify");
    expect(schema.mainEntity.every(i => i["@type"] === "Question")).toBe(true);
    expect(serializeVerificationFaqSchema("https://amaanafoundation.org")).not.toContain("<script>");
  });
});
