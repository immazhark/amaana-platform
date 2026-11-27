import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ section: vi.fn(), hero: vi.fn(), initiative: vi.fn(), enquiry: vi.fn() }));
vi.mock("@/components/taleem-sponsorship/taleem-sponsorship-section", () => ({ TaleemSponsorshipSection: mocks.section }));
vi.mock("@/lib/sponsorship-media", () => ({ getSponsorEducationHeroMedia: mocks.hero, isPublishedTaleemDestination: mocks.initiative }));
vi.mock("@/components/sponsorship-enquiry", () => ({ SponsorshipEnquiry: ({ preferences }: { preferences: Record<string, string | string[] | undefined> }) => { mocks.enquiry(preferences); return <section id="sponsorship-enquiry">Enquiry form</section>; } }));

import SponsorEducationPage from "./page";

const render = async (searchParams: Record<string, string | string[] | undefined> = {}) =>
  renderToStaticMarkup(await SponsorEducationPage({ searchParams: Promise.resolve(searchParams) }));
const at = (html: string, needle: string) => html.indexOf(needle);

describe("sponsor-education page while the programme form is open", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.hero.mockResolvedValue(null);
    mocks.initiative.mockResolvedValue(true);
    mocks.section.mockResolvedValue(<section id="programme-sponsorship">Programme form</section>);
  });

  it("puts the form before the programme cards, the school pathway and the enquiry", async () => {
    const html = await render();
    const form = at(html, 'id="programme-sponsorship"');
    expect(form).toBeGreaterThan(-1);
    for (const later of ['id="sponsorship-paths"', 'id="islamic-education-title"', 'id="child-education-title"', 'id="sponsorship-enquiry"']) {
      expect(at(html, later), later).toBeGreaterThan(form);
    }
  });

  it("renders the form once and passes the requested programme through", async () => {
    const html = await render({ programme: "nazira" });
    expect(html.match(/id="programme-sponsorship"/g)).toHaveLength(1);
    expect(mocks.section).toHaveBeenCalledWith({ programme: "nazira" });
  });

  it("keeps the checkout programme hint out of enquiry validation but preserves genuine enquiry and unknown fields", async () => {
    await render({ programme: "nazira", utm_source: "education-outreach" });
    expect(mocks.section).toHaveBeenCalledWith({ programme: "nazira" });
    expect(mocks.enquiry).toHaveBeenCalledWith({ utm_source: "education-outreach" });
    await render({ programme: "hifdh-day-scholar", path: "school", support: "discuss", studentName: "PRIVATE" });
    expect(mocks.enquiry).toHaveBeenLastCalledWith({ path: "school", support: "discuss", studentName: "PRIVATE" });
  });

  it("sends each programme card to the form on that programme instead of to a second enquiry", async () => {
    const html = await render();
    expect(html).toContain('href="/get-involved/sponsor-education?programme=hifdh-day-scholar#programme-sponsorship"');
    expect(html).toContain('href="/get-involved/sponsor-education?programme=nazira#programme-sponsorship"');
    expect(html).not.toContain("Ask about this sponsorship");
    expect(html.match(/id="sponsorship-enquiry"/g)).toHaveLength(1);
  });

  it("points the hero at the form that is really on the page", async () => {
    expect(await render()).toContain('href="#programme-sponsorship"');
  });
});

describe("sponsor-education page while the programme form is closed or unavailable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.hero.mockResolvedValue(null);
    mocks.initiative.mockResolvedValue(true);
    mocks.section.mockResolvedValue(null);
  });

  it("keeps the enquiry route and never links to an anchor that is not there", async () => {
    const html = await render();
    expect(html).not.toContain("programme-sponsorship");
    expect(html).toContain("Ask about this sponsorship");
    expect(html).toContain("path=hifdh&amp;support=discuss#sponsorship-enquiry");
    expect(html).toContain("path=nazira&amp;support=discuss#sponsorship-enquiry");
    expect(html).not.toContain("Give to a Taleem programme");
  });
});

describe("independent sponsorship reads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.hero.mockResolvedValue(null);
    mocks.initiative.mockResolvedValue(true);
    mocks.section.mockResolvedValue(null);
  });

  it("starts optional hero and publication reads before the programme lookup completes", async () => {
    let resolveSection: (value: null) => void = () => {};
    mocks.section.mockReturnValueOnce(new Promise<null>(resolve => { resolveSection = resolve; }));
    const pending = render({ programme: "nazira" });
    await Promise.resolve();
    await Promise.resolve();
    const started = [mocks.hero.mock.calls.length, mocks.initiative.mock.calls.length];
    resolveSection(null);
    const html = await pending;
    expect(started).toEqual([1, 1]);
    expect(html).toContain('href="/our-work/taleem"');
    expect(mocks.section).toHaveBeenCalledOnce();
  });

  it("keeps the enquiry available and links to published work if the Taleem destination is unavailable", async () => {
    mocks.initiative.mockResolvedValue(false);
    const html = await render();
    expect(html).toContain('href="/our-work"');
    expect(html).not.toContain('href="/our-work/taleem"');
    expect(html).toContain('id="sponsorship-enquiry"');
  });
});
