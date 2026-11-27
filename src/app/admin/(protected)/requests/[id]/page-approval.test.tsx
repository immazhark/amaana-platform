import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), staff: vi.fn(), history: vi.fn(), permission: vi.fn(), draft: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: vi.fn(async () => ({ id: "synthetic-staff" })), hasPermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { assistanceRequest: { findUnique: mocks.request, findMany: async () => [] }, user: { findMany: mocks.staff }, auditEvent: { findMany: mocks.history } } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.draft }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerificationWithFeedback: vi.fn(), updateRequestWithFeedback: vi.fn() }));
vi.mock("./rejection-actions", () => ({ rejectRequestAction: vi.fn() }));
vi.mock("./approval-actions", () => ({ approveRequestAction: vi.fn(), approveRequestWithFeedback: vi.fn(), saveReviewProgressWithFeedback: vi.fn() }));
import RequestDetailPage from "./page";

const base = {
  id: "synthetic-request", referenceNumber: "AF-SYNTH-888", applicantName: "Synthetic applicant", category: "MEDICAL", city: "Synthetic city",
  phone: "0000000000", email: "synthetic@example.invalid", description: "Synthetic request", status: "UNDER_VERIFICATION",
  createdAt: new Date("2026-11-20T00:00:00Z"), updatedAt: new Date("2026-11-22T04:00:00.000Z"), appealId: null, appeal: null,
  assignedToId: null, internalNotes: null, documents: [], verification: null, rejections: [],
};
const verification = (over: Record<string, unknown> = {}) => ({
  decision: "PENDING", confidentialityLevel: "CONFIDENTIAL", completedAt: null, updatedAt: new Date("2026-11-22T04:05:00.000Z"), reviewedBy: null,
  needConfirmed: false, evidenceReviewed: false, otherFundingChecked: false, verifiedNeedAmount: null, approvedPublicTarget: null, paymentDestination: null,
  otherFundingNotes: null, verificationSummary: null, publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED",
  institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED", ...over,
});
// The button itself, not the card's intro sentence, which always names the action.
const APPROVE_BUTTON = />Approve assistance<\/button>/;
const grant = (...keys: string[]) => mocks.permission.mockImplementation((_user, permission) => keys.includes(permission));
const render = async (over: Record<string, unknown> = {}, search: Record<string, string | string[] | undefined> = {}) => {
  mocks.request.mockResolvedValue({ ...base, ...over });
  return renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }), searchParams: Promise.resolve(search) }));
};
const reviewCard = (html: string) => html.match(/<section class="card">\s*<h2 id="review-heading">[\s\S]*?<\/section>/)?.[0] ?? "";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.staff.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  mocks.draft.mockReturnValue(undefined);
  grant("assistance.view", "assistance.update", "assistance.approve");
});

describe("one review form with two clear actions", () => {
  it("offers Save review progress and Approve assistance, and no longer the old Verification complete checkbox", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("Save review progress");
    expect(card).toMatch(APPROVE_BUTTON);
    expect(card).not.toContain("Verification complete");
    expect(card).not.toContain('name="markComplete"');
    expect(card).not.toContain("Save verification");
  });

  it("explains, in plain words before submission, what saving progress and approving each do", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("keeps your work without deciding anything");
    expect(card).toContain("completes the verification and approves the request in one step");
    expect(card).toContain("Approval is not payment");
    expect(card).toContain("does not publish anything");
  });

  it("asks for one explicit confirmation to approve, stated as required in words", async () => {
    const card = reviewCard(await render());
    expect(card).toContain('id="confirmApproval"');
    expect(card).toContain("I confirm I am approving this request on the support route chosen above");
    expect(card).toContain("queued is not delivered");
  });

  it.each(["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"])("is offered for a request in %s", async status => {
    expect(reviewCard(await render({ status }))).toMatch(APPROVE_BUTTON);
  });

  it.each(["APPROVED", "REJECTED", "CLOSED", "CONVERTED_TO_APPEAL"])("offers no approval for a request that is %s", async status => {
    const card = reviewCard(await render(status === "CONVERTED_TO_APPEAL" ? { status, appealId: "a1", appeal: { id: "a1", title: "t", status: "DRAFT" } } : { status }));
    expect(card).not.toMatch(APPROVE_BUTTON);
    expect(card).not.toContain('id="confirmApproval"');
    expect(card).toContain("Save review progress");
  });

  it("tells an editor who is not an approver that approval authority is needed, and offers no approve control", async () => {
    grant("assistance.view", "assistance.update");
    const card = reviewCard(await render());
    expect(card).toContain("only an authorised approver can approve a request");
    expect(card).not.toMatch(APPROVE_BUTTON);
    expect(card).not.toContain('id="confirmApproval"');
    expect(card).toContain("Save review progress");
  });
});

describe("the support route", () => {
  it("offers the three approvals and the two progress-only choices, and never offers Declined to choose", async () => {
    const card = reviewCard(await render());
    const select = card.match(/<select id="decision"[\s\S]*?<\/select>/)![0];
    const options = [...select.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
    expect(options).toEqual(["PENDING", "REFERRED", "APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC"]);
    for (const text of ["Not decided yet", "Referred elsewhere (saves progress only)", "Private assistance", "Partial support", "Public fundraising"]) expect(select).toContain(text);
  });

  it("keeps showing Declined when that is the saved decision, so nothing is hidden", async () => {
    const card = reviewCard(await render({ verification: verification({ decision: "DECLINED" }) }));
    expect(card).toContain('<option value="DECLINED"');
  });

  it("states what each route means and needs, visibly, not only in collapsed help", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("Private assistance");
    expect(card).toContain("No public appeal is created");
    expect(card).toContain("Partial funding and public visibility are different things");
    expect(card).toContain("Approval never publishes it");
    expect(card).toContain("Needs the approved public target and every disclosure permission decided");
    expect(card).not.toContain("<details");
  });
});

describe("requiredness is stated in words beside each field", () => {
  it("marks the substantive checks as required to approve, the public-only fields as public only, and notes as optional", async () => {
    const card = reviewCard(await render());
    for (const field of ["Need confirmed", "Supporting evidence reviewed", "Other funding checked", "Verified need amount", "Payment destination", "Verification summary", "Zakat review"]) {
      expect(card, field).toMatch(new RegExp(`${field}[\\s\\S]{0,120}Required to approve`));
    }
    for (const field of ["Approved public fundraising target", "Public name permission", "Photo/media permission", "Public archive permission after closure"]) {
      expect(card, field).toMatch(new RegExp(`${field}[\\s\\S]{0,160}Required for public fundraising only`));
    }
    expect(card).toMatch(/Other funding \/ duplication notes[\s\S]{0,60}Optional/);
  });

  it("explains the permission values and where the destination differs from Amaana's receiving account", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("Unconfirmed means the question is not finished");
    expect(card).toContain("Not allowed is a restriction");
    expect(card).toContain("Not applicable means genuinely irrelevant");
    expect(card).toContain("This is not Amaana&#x27;s own donation receiving account");
  });

  it("offers consent answers with their meaning, so UNCONFIRMED is never mistaken for consent", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("Unconfirmed (not decided yet)");
    expect(card).toContain("Not allowed (a restriction)");
    expect(card).toContain("Not applicable (genuinely irrelevant)");
  });
});

describe("after an approval attempt that was not ready", () => {
  const search = { approve: "error", e: "needConfirmed,approvedPublicTarget_exceeds,confirmation" };

  it("lists every problem in a summary that links to each field, and says the entered work was saved", async () => {
    const card = reviewCard(await render({ verification: verification() }, search));
    expect(card).toContain('id="approve-errors"');
    expect(card).toContain('role="alert"');
    expect(card).toContain("There is a problem");
    expect(card).toContain('<a href="#needConfirmed">Need must be confirmed.</a>');
    expect(card).toContain('<a href="#approvedPublicTarget">Approved public target cannot exceed the verified need amount.</a>');
    expect(card).toContain('<a href="#confirmApproval">Confirm the approval to continue.</a>');
    expect(card).toContain("What you entered has been saved as review progress. Nothing has been approved.");
  });

  it("marks only the fields in error, connects their messages, and keeps the others clean", async () => {
    const card = reviewCard(await render({ verification: verification() }, search));
    expect(card).toMatch(/id="needConfirmed"[^>]*aria-invalid="true"[^>]*aria-describedby="needConfirmed-error"/);
    expect(card).toMatch(/id="approvedPublicTarget"[^>]*aria-invalid="true"[^>]*aria-describedby="approvedPublicTarget-hint approvedPublicTarget-error"/);
    expect(card).toMatch(/id="confirmApproval"[^>]*aria-invalid="true"[^>]*aria-describedby="confirmApproval-error"/);
    for (const id of ["needConfirmed-error", "approvedPublicTarget-error", "confirmApproval-error"]) expect(card).toContain(`id="${id}"`);
    expect(card).not.toMatch(/id="evidenceReviewed"[^>]*aria-invalid/);
    expect(card).not.toContain('id="paymentDestination-error"');
  });

  it("shows a form-level refusal such as a conflict, without field errors", async () => {
    const card = reviewCard(await render({}, { approve: "error", code: "stale_request" }));
    expect(card).toContain("This could not be approved");
    expect(card).toContain("This request changed while you were reviewing it.");
    expect(card).not.toContain("aria-invalid");
  });

  it("brings back the text of an amount that could not be saved, from the private cookie, only after such an error", async () => {
    mocks.draft.mockReturnValue({ value: encodeURIComponent(JSON.stringify({ v: "five thousand", t: "4,5oo" })) });
    const card = reviewCard(await render({ verification: verification({ verifiedNeedAmount: { toString: () => "1200", toNumber: () => 1200 } }) }, { approve: "error", e: "verifiedNeedAmount_format,approvedPublicTarget_format" }));
    expect(card).toMatch(/id="verifiedNeedAmount"[^>]*value="five thousand"/);
    expect(card).toMatch(/id="approvedPublicTarget"[^>]*value="4,5oo"/);
    expect(mocks.draft).toHaveBeenCalledWith("amaana_ad_synthetic-request");
  });

  it("reads that cookie only after an amount error, so a stale one never fills the form on an ordinary visit", async () => {
    mocks.draft.mockReturnValue({ value: encodeURIComponent(JSON.stringify({ v: "stale", t: "stale" })) });
    for (const searchParams of [{}, { approve: "error", e: "needConfirmed" }, { approve: "done" }]) {
      expect(reviewCard(await render({ verification: verification({ verifiedNeedAmount: { toString: () => "1200", toNumber: () => 1200 } }) }, searchParams))).not.toContain('value="stale"');
    }
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it("puts no words on the page from a crafted link", async () => {
    const html = await render({}, { approve: "error", e: "<script>alert(1)</script>", code: "<b>owned</b>" });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<b>owned</b>");
    expect(reviewCard(html)).toContain("The form was not submitted correctly.");
  });
});

describe("after an approval", () => {
  const approved = { status: "APPROVED", verification: verification({ decision: "APPROVED_PUBLIC", completedAt: new Date("2026-11-22T05:00:00Z") }) };

  it.each([
    ["APPROVED_PRIVATE", "as private assistance", "No public appeal is created."],
    ["APPROVED_PARTIAL", "as partial support", "No public appeal is created."],
    ["APPROVED_PUBLIC", "as public fundraising", "Nothing has been published"],
  ])("says plainly what approving %s did and did not do", async (route, phrase, next) => {
    const card = reviewCard(await render(approved, { approve: "done", o: "approved", r: route }));
    expect(card).toContain('id="approve-heading"');
    expect(card).toContain("Request approved");
    expect(card).toContain("AF-SYNTH-888 is now <strong>Approved</strong>");
    expect(card).toContain(phrase);
    expect(card).toContain(next);
    expect(card).toContain("Approved does not mean funds have been paid.");
  });

  it("says a repeat was already approved, and never shows the banner for a request that is not approved", async () => {
    expect(reviewCard(await render(approved, { approve: "done", o: "already_approved", r: "APPROVED_PUBLIC" }))).toContain("This request was already approved");
    expect(reviewCard(await render({}, { approve: "done", o: "approved", r: "APPROVED_PUBLIC" }))).not.toContain("Request approved");
  });
});

describe("accessibility of the review card", () => {
  it("puts no aria-label on an element without a role: assistive technology is not meant to read it (aria-prohibited-attr)", async () => {
    const card = reviewCard(await render({ verification: verification() }, { approve: "error", e: "needConfirmed,target_missing", code: null as unknown as string }));
    const labelled = [...card.matchAll(/<(?:span|div|p|dl|dt|dd|small|strong|section)(?= |>)[^>]*? aria-label="[^"]*"[^>]*>/g)].map(match => match[0]);
    for (const tag of labelled) expect(tag, tag).toMatch(/role="/);
  });

  it("names the route meanings with a visible heading, not a label on a list", async () => {
    const card = reviewCard(await render());
    expect(card).toContain("<h3>What each support route means and needs</h3>");
  });

  it("gives every form control in the review form a label", async () => {
    const card = reviewCard(await render({ verification: verification() }));
    const controls = [...card.matchAll(/<(?:input|select|textarea)(?= |>)[^>]*>/g)].map(match => match[0]).filter(tag => !tag.includes('type="hidden"'));
    expect(controls.length).toBeGreaterThan(12);
    for (const tag of controls) {
      const id = /(?: |^)id="([^"]+)"/.exec(tag)?.[1];
      expect(id, tag).toBeTruthy();
      // A control is labelled by a for= label, or sits inside a wrapping label (the checkboxes).
      const chunk = card.split("</label>").find(part => part.includes(`id="${id}"`));
      const wrapped = chunk !== undefined && chunk.lastIndexOf("<label") !== -1 && chunk.lastIndexOf("<label") < chunk.indexOf(`id="${id}"`);
      expect(wrapped || card.includes(`for="${id}"`), tag).toBe(true);
    }
  });
});

describe("what stays out of reach", () => {
  it("locks every field and offers no approval for a converted request", async () => {
    const card = reviewCard(await render({ status: "CONVERTED_TO_APPEAL", appealId: "a1", appeal: { id: "a1", title: "t", status: "DRAFT" }, verification: verification() }));
    expect(card).toContain("Verification is locked while this request is approved, rejected, closed or linked to an appeal");
    expect(card).not.toMatch(APPROVE_BUTTON);
    expect((card.match(/disabled=""/g) ?? []).length).toBeGreaterThan(8);
  });

  it("never shows the reviewer's private summary anywhere but its own field", async () => {
    const html = await render({ verification: verification({ verificationSummary: "PRIVATE-SUMMARY-TEXT" }) });
    expect(html.split("PRIVATE-SUMMARY-TEXT")).toHaveLength(2);
  });
});


describe("approval summary and completed decision protection", () => {
  it("requires the check-answers interaction before enabling approval", async () => {
    const html = await render();
    expect(html).toContain('data-review-approval="" disabled=""');
    expect(html).toContain("Check answers before approval");
    expect(html).toContain("Confirm approval");
  });
  it("locks completed review fields and Save progress after approval", async () => {
    const html = await render({ status: "APPROVED", verification: verification({ decision: "APPROVED_PRIVATE", completedAt: new Date(), reviewedBy: { name: "Synthetic approver" } }) });
    expect(html).toMatch(/id="verifiedNeedAmount"[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Save review progress<\/button>/);
  });
  it("does not claim progress was saved when the draft write failed", async () => {
    const html = await render({}, { approve: "error", e: "needConfirmed", code: "draft_save_failed" });
    expect(html).toContain("Review progress was not confirmed saved");
    expect(html).not.toContain("What you entered has been saved");
  });
});

it("posts only accepted queue context with the approval and rejection forms", async () => {
  const html = await render({}, { queueStatus: "SUBMITTED", queueAssignment: "mine", queueCategory: "MEDICAL", queuePage: "3", queueSort: "oldest", queueView: "//evil.test", returnTo: "https://evil.test" });
  const card = reviewCard(html);
  const rejection = html.match(/<section class="card" aria-labelledby="reject-heading">[\s\S]*?<\/section>/)?.[0] ?? "";
  for (const form of [card, rejection]) {
    expect(form).toContain('name="queueStatus" value="SUBMITTED"');
    expect(form).toContain('name="queueAssignment" value="mine"');
    expect(form).toContain('name="queueCategory" value="MEDICAL"');
    expect(form).toContain('name="queuePage" value="3"');
    expect(form).toContain('name="queueSort" value="oldest"');
    expect(form).not.toContain('name="queueView"');
    expect(form).not.toContain('name="returnTo"');
  }
});
