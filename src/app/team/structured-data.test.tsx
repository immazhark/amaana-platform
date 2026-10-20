import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/team-data", () => ({
  getPublishedTeam: async () => [{
    id: "synthetic-group", key: "TRUSTEES", title: "Trustees", description: null,
    members: [{
      id: "synthetic-member", fullName: "Synthetic Member", designation: "Trustee",
      slug: "synthetic-member", photoStorageKey: "synthetic-photo", photoConsentAt: new Date(),
      photoAlt: null, bio: null, linkedinUrl: null, email: null, updatedAt: new Date("2026-10-20T00:00:00Z"),
    }],
  }],
}));

import TeamPage from "./page";

afterEach(() => vi.unstubAllEnvs());

describe("Team structured data", () => {
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
