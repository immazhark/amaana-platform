import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), staff: vi.fn(), history: vi.fn(), permission: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: vi.fn(async () => ({ id: "synthetic-staff" })), hasPermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { assistanceRequest: { findUnique: mocks.request }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerificationWithFeedback: vi.fn(), updateRequestWithFeedback: vi.fn() }));
vi.mock("./rejection-actions", () => ({ rejectRequestAction: vi.fn() }));
import RequestDetailPage from "./page";

const base = {
  id: "synthetic-request", referenceNumber: "AF-SYNTH-777", applicantName: "Synthetic applicant", category: "MEDICAL", city: "Synthetic city",
  phone: "0000000000", email: "synthetic@example.invalid", description: "Synthetic request", status: "SUBMITTED",
  createdAt: new Date("2026-11-20T00:00:00Z"), updatedAt: new Date("2026-11-22T04:00:00.000Z"), appealId: null, appeal: null,
  assignedToId: null, internalNotes: null, documents: [], verification: null, rejections: [],
};
const grant = (...keys: string[]) => mocks.permission.mockImplementation((_user, permission) => keys.includes(permission));
const render = async (over: Record<string, unknown> = {}) => {
  mocks.request.mockResolvedValue({ ...base, ...over });
  return renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));
};
const rejectCard = (html: string) => html.match(/<section class="card" aria-labelledby="reject-heading">[\s\S]*?<\/section>/)?.[0] ?? "";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.staff.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  grant("assistance.view", "assistance.update", "assistance.approve");
});

describe("an eligible request, seen by an approver", () => {
  it("offers Reject request directly, before the verification form, with nothing to complete first", async () => {
    const html = await render();
    const card = rejectCard(html);
    expect(card).toContain("<h2 id=\"reject-heading\">Reject request</h2>");
    expect(card).toContain("You do not need to complete any approval check to reject a request");
    expect(card).toContain('name="reason"');
    expect(card).toContain("Confirm rejection");
    expect(html.indexOf('id="reject-heading"')).toBeLessThan(html.indexOf("Private verification"));
  });

  it("works from a request with no verification record at all, sending an empty verification version", async () => {
    const card = rejectCard(await render({ verification: null }));
    expect(card).toContain('name="expectedVerificationUpdatedAt" value=""');
    expect(card).toContain('name="expectedRequestUpdatedAt" value="2026-11-22T04:00:00.000Z"');
  });

  it("sends the verification version when one exists, and still asks only for a reason and a confirmation", async () => {
    const card = rejectCard(await render({ status: "UNDER_VERIFICATION", verification: { decision: "PENDING", confidentialityLevel: "CONFIDENTIAL", completedAt: null, updatedAt: new Date("2026-11-22T04:05:00.000Z"), reviewedBy: null, needConfirmed: false, evidenceReviewed: false, otherFundingChecked: false, verifiedNeedAmount: null, approvedPublicTarget: null, publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED" } }));
    expect(card).toContain('name="expectedVerificationUpdatedAt" value="2026-11-22T04:05:00.000Z"');
    expect([...card.matchAll(/\bname="([^"]+)"/g)].map(match => match[1]).sort()).toEqual(["confirmRejection", "expectedRequestUpdatedAt", "expectedVerificationUpdatedAt", "id", "reason"]);
  });

  it.each(["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"])("is available from %s", async status => {
    expect(rejectCard(await render({ status }))).toContain("Confirm rejection");
  });

  it("no longer offers REJECTED as a manual status choice anywhere on the page", async () => {
    const select = (await render()).match(/<select\b[^>]*name="status"[^>]*>([\s\S]*?)<\/select>/)![1]!;
    expect(select).not.toContain('value="REJECTED"');
  });
});

describe("who sees the form", () => {
  it("tells an editor who is not an approver that approval authority is needed, and shows no form", async () => {
    grant("assistance.view", "assistance.update");
    const card = rejectCard(await render());
    expect(card).toContain("Only an authorised approver can reject a request");
    expect(card).not.toContain("<form");
    expect(card).not.toContain("Confirm rejection");
  });

  it("shows a viewer who cannot edit the same explanation and no form", async () => {
    grant("assistance.view");
    expect(rejectCard(await render())).not.toContain("<form");
  });
});

describe("states where rejection is not offered", () => {
  it("explains a converted request and points to the linked appeal, without a rejection form", async () => {
    grant("assistance.view", "assistance.update", "assistance.approve", "appeal.view");
    const card = rejectCard(await render({ status: "CONVERTED_TO_APPEAL", appealId: "appeal-1", appeal: { id: "appeal-1", title: "Synthetic appeal", status: "PUBLISHED" } }));
    expect(card).toContain("This request has a linked appeal. Open the appeal to manage its status.");
    expect(card).toContain("does not change donations or financial records by itself");
    expect(card).toContain('href="/admin/appeals/appeal-1"');
    expect(card).not.toContain("<form");
  });

  it("treats a request with a linked appeal as converted whatever its status says", async () => {
    const card = rejectCard(await render({ status: "APPROVED", appealId: "appeal-1", appeal: { id: "appeal-1", title: "t", status: "DRAFT" } }));
    expect(card).toContain("This request has a linked appeal.");
    expect(card).not.toContain("<form");
  });

  it("explains a closed request instead of offering rejection", async () => {
    const card = rejectCard(await render({ status: "CLOSED" }));
    expect(card).toContain("This request is closed. Reopen the review under Review first");
    expect(card).not.toContain("<form");
  });

  it("shows nothing for a status it does not recognise", async () => {
    expect(rejectCard(await render({ status: "SOMETHING_NEW" }))).toBe("");
  });
});

describe("a request that is already rejected", () => {
  it("shows who recorded it, when, and the private reason, and offers no second rejection", async () => {
    const html = await render({ status: "REJECTED", rejections: [{ reason: "Duplicate of AF-2026-100000", rejectedAt: new Date("2026-11-22T04:10:00.000Z"), rejectedBy: { name: "Synthetic Approver" } }] });
    const card = rejectCard(html);
    expect(card).toContain('<h2 id="reject-heading">Request rejected</h2>');
    expect(card).toContain("Synthetic Approver");
    expect(card).toContain("22 November 2026");
    expect(card).toContain("Reason (private)");
    expect(card).toContain("Duplicate of AF-2026-100000");
    expect(card).toContain("an earlier decision stays on record");
    expect(card).not.toContain("<form");
  });

  it("labels a legacy rejection that has no recorded reason, and invents nothing", async () => {
    const card = rejectCard(await render({ status: "REJECTED", rejections: [] }));
    expect(card).toContain("rejected before reasons were recorded");
    expect(card).toContain("none has been invented");
    expect(card).not.toContain("Reason (private)");
    expect(card).not.toContain("Recorded by");
  });
});

describe("the reason stays out of everything but this card", () => {
  it("is not repeated in the audit history, the notes or the status controls", async () => {
    const html = await render({ status: "REJECTED", rejections: [{ reason: "PRIVATE-REASON-TEXT", rejectedAt: new Date(), rejectedBy: { name: "Synthetic Approver" } }] });
    expect(html.split("PRIVATE-REASON-TEXT")).toHaveLength(2);
  });
});
