import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealShare, runAppealShare } from "./appeal-share";

const appeal = {
  title: "Verified education appeal",
  summary: "Help provide essential learning materials.",
  url: "https://amaanafoundation.org/appeals/verified-education",
};

afterEach(() => vi.unstubAllGlobals());

describe("appeal sharing recovery", () => {
  it("sends a complete canonical appeal to native sharing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    await expect(runAppealShare(appeal, "share")).resolves.toBe("Share completed.");
    expect(share).toHaveBeenCalledWith({ title: appeal.title, text: appeal.summary, url: appeal.url });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("does not copy or announce success after native sharing is cancelled", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
      clipboard: { writeText },
    });
    await expect(runAppealShare(appeal, "share")).resolves.toBe("");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the canonical URL after a native share failure", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("Not allowed")), clipboard: { writeText } });

    await expect(runAppealShare(appeal, "share")).resolves.toBe("Link copied.");
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(appeal.url);
  });

  it("shows the manual fallback when both native sharing and the clipboard fail", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("Sharing unavailable")),
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")) },
    });
    await expect(runAppealShare(appeal, "share")).resolves.toBe("Copy unavailable. Select the URL below.");
  });

  it("copies on browsers without native share support", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(runAppealShare(appeal, "share")).resolves.toBe("Link copied.");
    expect(writeText).toHaveBeenCalledWith(appeal.url);
  });

  it("provides manual copy when the clipboard API is missing", async () => {
    vi.stubGlobal("navigator", {});
    await expect(runAppealShare(appeal, "share")).resolves.toBe("Copy unavailable. Select the URL below.");
    await expect(runAppealShare(appeal, "copy")).resolves.toBe("Copy unavailable. Select the URL below.");
  });

  it("uses clipboard only for an explicit copy request", async () => {
    const share = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    await expect(runAppealShare(appeal, "copy")).resolves.toBe("Link copied.");
    expect(share).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(appeal.url);
  });

  it("offers manual copy instead of claiming success when explicit copying fails", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    await expect(runAppealShare(appeal, "copy")).resolves.toBe("Copy unavailable. Select the URL below.");
  });

  it("never shares an external origin when a malformed route path begins with two slashes", () => {
    const html = renderToStaticMarkup(<AppealShare
      title={appeal.title}
      summary={appeal.summary}
      path="//malicious.example/appeals/fake"
    />);
    expect(html).not.toContain("malicious.example");
    expect(html).toContain("https%3A%2F%2Famaanafoundation.org%2F");
  });

  it("renders a safe native WhatsApp link with the fully qualified canonical URL", () => {
    const html = renderToStaticMarkup(<AppealShare
      title={appeal.title}
      summary={appeal.summary}
      path="/appeals/verified-education"
    />);
    expect(html).toContain('href="https://wa.me/?text=');
    expect(html).toContain("https%3A%2F%2Famaanafoundation.org%2Fappeals%2Fverified-education");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Could not copy");
    const whatsapp = html.match(/<a[^>]*href="https:\/\/wa\.me\/\?text=[^"]+"[^>]*>[\s\S]*?<\/a>/)?.[0];
    expect(whatsapp).toBeTruthy();
    expect(whatsapp).toContain('<span class="sr-only">(opens in a new tab)</span>');
  });
});
