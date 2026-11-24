import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), paymentDetails: vi.fn(), logServerError: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: mocks.paymentDetails }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.logServerError }));

import { TaleemSponsorshipConfigurator } from "./taleem-sponsorship-configurator";
import { TaleemSponsorshipSection } from "./taleem-sponsorship-section";

const taleem = { slug: "taleem", name: "Taleem Fund", summary: "Qur'an and Islamic education.", zakatPolicy: "ACCEPTED", isGeneral: false };
const details = { upi: { id: "synthetic@bank", qrImageUrl: null }, bank: null };

describe("Taleem sponsorship section on the sponsor-education page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(taleem);
    mocks.paymentDetails.mockReturnValue(details);
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("renders nothing and never touches the database while the switches are off", async () => {
    expect(await TaleemSponsorshipSection()).toBeNull();
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    expect(await TaleemSponsorshipSection()).toBeNull();
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    expect(await TaleemSponsorshipSection()).toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.paymentDetails).not.toHaveBeenCalled();
  });

  it("preselects the requested programme only when it is in the live offer", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    expect((await TaleemSponsorshipSection({ programme: "nazira" }))?.props.initialProgrammeId).toBe("nazira");
    expect((await TaleemSponsorshipSection({ programme: ["hifdh-day-scholar", "qaida"] }))?.props.initialProgrammeId).toBe("hifdh-day-scholar");
    for (const programme of [undefined, "", "unknown", "NAZIRA", "__proto__", []]) {
      expect((await TaleemSponsorshipSection({ programme }))?.props.initialProgrammeId).toBeUndefined();
    }
  });

  it("renders the configurator for the active Taleem fund only when both switches are on", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    const element = await TaleemSponsorshipSection();
    expect(element).not.toBeNull();
    expect(element?.type).toBe(TaleemSponsorshipConfigurator);
    expect(element?.props).toMatchObject({ fund: taleem, paymentDetails: details });
    // The form copy is built on the server and handed down, not imported by the client chunk.
    expect(element?.props.copy).toBeDefined();
    expect(element?.props.copy.heading).toBeDefined();
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "taleem", status: "ACTIVE" } }));
  });

  it("renders nothing when the Taleem fund is not active", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    mocks.findFirst.mockResolvedValue(null);
    expect(await TaleemSponsorshipSection()).toBeNull();
  });

  it("degrades to the page without the section, and logs no private detail, when a lookup fails", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    mocks.findFirst.mockRejectedValue(new Error("connection string postgres://user:secret@host/db"));
    await expect(TaleemSponsorshipSection()).resolves.toBeNull();
    expect(mocks.logServerError).toHaveBeenCalledWith("taleem_sponsorship_section_unavailable", { errorName: "Error" });
    expect(JSON.stringify(mocks.logServerError.mock.calls)).not.toContain("secret");
  });
});
