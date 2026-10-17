import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppealShare } from "./appeal-share";
import { SENSITIVE_APPEAL_TITLE, SENSITIVE_APPEAL_DESCRIPTION } from "@/lib/appeal-public-copy";

describe("appeal share controls", () => {
  it("server-renders an accessible WhatsApp anchor with a canonical path and encoded generic details", () => {
    const html = renderToStaticMarkup(
      <AppealShare
        title={SENSITIVE_APPEAL_TITLE}
        summary={SENSITIVE_APPEAL_DESCRIPTION}
        path="/appeals/synthetic-verified-appeal"
      />,
    );

    const href = html.match(/href="(https:\/\/wa\.me\/\?text=[^"]+)"/)?.[1];
    expect(href).toBeTruthy();

    const url = new URL(href!.replaceAll("&amp;", "&"));
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("wa.me");

    const message = url.searchParams.get("text");
    expect(message).toContain(SENSITIVE_APPEAL_TITLE);
    expect(message).toContain(SENSITIVE_APPEAL_DESCRIPTION);
    expect(message).toContain("/appeals/synthetic-verified-appeal");
    expect(html).toMatch(/target="_blank"/);
    expect(html).toMatch(/rel="noopener noreferrer"/);
    expect(html).not.toContain("window.open");
  });

  it("preserves UTF-8 safely in an encoded sharing URL", () => {
    const text = "Care & community — ₹";
    const html = renderToStaticMarkup(
      <AppealShare title={text} summary={text} path="/appeals/example" />,
    );
    const href = html.match(/href="(https:\/\/wa\.me\/\?text=[^"]+)"/)?.[1];
    expect(href).toBeTruthy();
    const decoded = new URL(href!.replaceAll("&amp;", "&")).searchParams.get("text");
    expect(decoded).toContain(text);
  });
});
