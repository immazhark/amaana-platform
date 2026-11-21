import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/team-data", () => ({
  getPublishedTeam: async () => [{
    id: "synthetic-group", key: "TRUSTEES", title: "Trustees", description: null,
    members: [{
      id: "synthetic-member", fullName: "Synthetic Member", designation: "Trustee",
      slug: "synthetic-member", photoStorageKey: "synthetic-photo", photoConsentAt: new Date(),
      photoAlt: null, bio: null, linkedinUrl: "https://www.linkedin.com/in/synthetic-member/", email: "valid@example.org", updatedAt: new Date("2026-10-20T00:00:00Z"),
    }, {
      id: "synthetic-legacy-1", fullName: "Synthetic Legacy One", designation: "Trustee",
      slug: "synthetic-legacy-one", photoStorageKey: null, photoConsentAt: null,
      photoAlt: null, bio: null, linkedinUrl: "javascript:alert(1)",
      email: "attacker@example.invalid?bcc=private", updatedAt: new Date("2026-10-20T00:00:00Z"),
    }, {
      id: "synthetic-legacy-2", fullName: "Synthetic Legacy Two", designation: "Volunteer",
      slug: "synthetic-legacy-two", photoStorageKey: null, photoConsentAt: null,
      photoAlt: null, bio: null, linkedinUrl: "https://example.invalid/profile",
      email: "not-an-email", updatedAt: new Date("2026-10-20T00:00:00Z"),
    }],
  }],
}));

import TeamPage from "./page";

afterEach(() => vi.unstubAllEnvs());

describe("Team structured data", () => {
  it("announces the LinkedIn new-tab context in the accessible name", async () => {
    const markup = renderToStaticMarkup(await TeamPage());
    const link = markup.match(/<a[^>]*href="https:\/\/www\.linkedin\.com\/in\/synthetic-member\/"[^>]*>[^<]*<\/a>/)?.[0];
    expect(link).toBeTruthy();
    expect(link).toContain('aria-label="Synthetic Member, Trustee, on LinkedIn (opens in a new tab)"');
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
  });


  it("renders only verified legacy public team contact destinations", async () => {
    const markup = renderToStaticMarkup(await TeamPage());
    expect(markup).toContain('href="https://www.linkedin.com/in/synthetic-member/"');
    expect(markup).toContain('href="mailto:valid@example.org"');
    expect(markup).not.toContain('href="javascript:');
    expect(markup).not.toContain('href="https://example.invalid/profile"');
    expect(markup).not.toContain('href="mailto:not-an-email"');
    expect(markup).not.toContain('href="mailto:attacker@example.invalid?bcc=private"');
    // The member remains visible; only the unsafe actions are omitted.
    expect(markup).toContain("Synthetic Legacy One");
    expect(markup).toContain("Synthetic Legacy Two");
  });

  it("uses the canonical Organization identity and photo origin with a configured URL path", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org/config?preview=1#settings");
    const markup = renderToStaticMarkup(await TeamPage());
    const content = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(content).toBeTruthy();
    const schema = JSON.parse(content || "{}");
    expect(schema["@id"]).toBe("https://amaanafoundation.org/#organization");
    expect(schema.member[0].image).toBe("https://amaanafoundation.org/team/photo/synthetic-member");
    expect(schema.member[0].name).toBe("Synthetic Member");
  });
});
