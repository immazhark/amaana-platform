import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicMedia } from "./public-media";

const asset = {
  id: "approved-photo",
  kind: "IMAGE" as const,
  title: null,
  publicUrl: "https://amaanafoundation.org/media/approved.webp",
  externalUrl: null,
  altText: "Approved community outreach photo",
  caption: null,
  sourceYear: 2026,
  width: 1200,
  height: 800,
};

describe("AF-R056 blur-up placeholder rendering", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders a stored valid placeholder as the blur background", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({ asset: { ...asset, placeholder: "data:image/webp;base64,AAAA" } }));
    expect(html).toContain("data:image/webp;base64,AAAA");
  });

  it("renders no placeholder when none is stored", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({ asset: { ...asset, placeholder: null } }));
    expect(html).not.toContain("data:image");
  });

  it.each([
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "https://example.com/blur.webp",
    `data:image/webp;base64,${"A".repeat(1000)}`,
  ])("ignores an invalid stored placeholder: %s", placeholder => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const html = renderToStaticMarkup(PublicMedia({ asset: { ...asset, placeholder } }));
    expect(html).not.toContain(placeholder);
  });

  it("never renders a placeholder for an asset that fails the public-render gate", () => {
    const html = renderToStaticMarkup(PublicMedia({
      asset: { ...asset, publicUrl: null, externalUrl: null, placeholder: "data:image/webp;base64,AAAA" },
    }) ?? <></>);
    expect(html).not.toContain("data:image/webp");
  });
});
