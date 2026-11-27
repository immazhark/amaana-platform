import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), staff: vi.fn(), history: vi.fn(), permission: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(async () => ({ id: "synthetic-staff" })),
  hasPermission: mocks.permission,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request, findMany: async () => [] }, user: { findMany: mocks.staff },
  auditEvent: { findMany: mocks.history },
} }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("./actions", () => ({
  assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerificationWithFeedback: vi.fn(), updateRequestWithFeedback: vi.fn(),
}));
import RequestDetailPage from "./page";

function request(status: string) {
  return {
    id: "synthetic-request", referenceNumber: "AF-SYNTH-001", applicantName: "Synthetic applicant",
    category: "MEDICAL", city: "Synthetic city", phone: "0000000000", email: null,
    description: "Synthetic request", status, createdAt: new Date("2026-10-27T00:00:00Z"),
    updatedAt: new Date("2026-10-27T00:00:00Z"), appealId: null, appeal: null,
    assignedToId: null, internalNotes: "Synthetic note", documents: [], verification: null,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.staff.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  mocks.permission.mockImplementation((_user, permission) => ["assistance.view", "assistance.update"].includes(permission));
});

async function statusOptions(status: string) {
  mocks.request.mockResolvedValue(request(status));
  const html = renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));
  const select = html.match(/<select\b[^>]*name="status"[^>]*>([\s\S]*?)<\/select>/);
  if (!select) throw new Error("Expected request status selector");
  const options = [...select[1]!.matchAll(/<option\b([^>]*)>/g)].map(([, attributes]) => ({
    value: attributes!.match(/value="([^"]+)"/)?.[1], selected: /\bselected=""/.test(attributes!),
  }));
  return { html, select: select[0], options };
}

describe("reviewer guidance when information is missing", () => {
  it("presents a separate, clear action to request additional information and explains private follow-up", async () => {
    const { html } = await statusOptions("SUBMITTED");
    expect(html).toContain("Request additional information");
    expect(html).toContain("List the specific missing items");
    expect(html).toContain("contact the applicant through a verified private channel");
    expect(html).toContain("No applicant upload or reply portal is available");
    expect(html).toContain('name="status" value="DOCUMENTS_REQUESTED"');
    expect(html).toContain("Mark awaiting information");
    expect(html).toContain("Review workflow guide");
  });

  it("explains how to resume verification when an application awaits documents", async () => {
    const { html } = await statusOptions("DOCUMENTS_REQUESTED");
    expect(html).toContain("Awaiting information from applicant");
    expect(html).toContain("resume verification");
  });
});

describe("one path for requesting additional information", () => {
  it.each(["SUBMITTED", "UNDER_VERIFICATION"])("does not offer DOCUMENTS_REQUESTED in the generic %s status editor", async status => {
    const { html, options } = await statusOptions(status);
    expect(options.some(option => option.value === "DOCUMENTS_REQUESTED")).toBe(false);
    expect(html).toContain('name="status" value="DOCUMENTS_REQUESTED"');
    expect(html).toContain("Request additional information");
  });

  it("preserves the existing DOCUMENTS_REQUESTED state for note-only saves and allows verification to resume", async () => {
    const { options } = await statusOptions("DOCUMENTS_REQUESTED");
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual(["DOCUMENTS_REQUESTED"]);
    expect(options.some(option => option.value === "UNDER_VERIFICATION")).toBe(true);
  });
});

describe("request review current-status preservation", () => {
  it.each(["APPROVED", "REJECTED"])("retains %s for a note-only editor without granting the other restricted transition", async status => {
    const { options } = await statusOptions(status);
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual([status]);
    expect(options.some(option => option.value === (status === "APPROVED" ? "REJECTED" : "APPROVED"))).toBe(false);
  });

  it("keeps restricted transitions absent for a submitted request", async () => {
    const { options } = await statusOptions("SUBMITTED");
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual(["SUBMITTED"]);
    expect(options.some(option => ["APPROVED", "REJECTED"].includes(option.value ?? ""))).toBe(false);
  });

  it("keeps approval and rejection out of the generic editor even for approvers", async () => {
    mocks.permission.mockReturnValue(true);
    for (const status of ["SUBMITTED", "UNDER_VERIFICATION", "APPROVED", "REJECTED"]) {
      const { options } = await statusOptions(status);
      expect(options.filter(option => option.selected).map(option => option.value)).toEqual([status]);
      expect(options.filter(option => ["APPROVED", "REJECTED"].includes(option.value ?? "")).map(option => option.value)).toEqual(["APPROVED", "REJECTED"].includes(status) ? [status] : []);
    }
  });

  it("keeps converted status locked with its hidden form value", async () => {
    const { html, select, options } = await statusOptions("CONVERTED_TO_APPEAL");
    expect(select).toContain('disabled=""');
    expect(options).toEqual([{ value: "CONVERTED_TO_APPEAL", selected: true }]);
    expect(html).toContain('type="hidden" name="status" value="CONVERTED_TO_APPEAL"');
  });
});


async function assignmentOptions(assignedToId: string | null, eligible = false) {
  mocks.request.mockResolvedValue({ ...request("SUBMITTED"), assignedToId,
    assignedTo: assignedToId ? { id: assignedToId, name: "Synthetic current staff" } : null,
  });
  mocks.staff.mockResolvedValue(eligible ? [{ id: assignedToId, name: "Synthetic current staff" }] : []);
  const html = renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));
  const select = html.match(/<select\b[^>]*name="assignedToId"[^>]*>([\s\S]*?)<\/select>/);
  if (!select) throw new Error("Expected request assignment selector");
  const options = [...select[1]!.matchAll(/<option\b([^>]*)>([^<]*)<\/option>/g)].map(([, attributes, text]) => ({
    value: attributes!.match(/value="([^"]*)"/)?.[1], selected: /\bselected=""/.test(attributes!),
    disabled: /\bdisabled/.test(attributes!), text,
  }));
  return { html, options };
}

describe("request current-assignment preservation", () => {
  it("keeps an unavailable current assignee selected instead of implicitly unassigning", async () => {
    const { html, options } = await assignmentOptions("synthetic-inactive");
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual(["synthetic-inactive"]);
    expect(options.find(option => option.value === "synthetic-inactive")).toMatchObject({
      disabled: false, text: "Synthetic current staff (currently unavailable)",
    });
    expect(options.find(option => option.value === "")).toMatchObject({ selected: false });
    expect(html).toContain("Choose an available staff member or Unassigned before saving a change.");
  });

  it("does not duplicate or relabel an eligible current assignee", async () => {
    const { html, options } = await assignmentOptions("synthetic-active", true);
    expect(options.filter(option => option.value === "synthetic-active")).toEqual([{
      value: "synthetic-active", selected: true, disabled: false, text: "Synthetic current staff",
    }]);
    expect(html).not.toContain("currently unavailable");
  });

  it("preserves a genuinely unassigned request", async () => {
    const { html, options } = await assignmentOptions(null);
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual([""]);
    expect(html).not.toContain("currently unavailable");
  });
});

describe("request to appeal staff navigation", () => {
  it("provides a direct editor link for a converted appeal to staff with appeal.view", async () => {
    mocks.permission.mockImplementation((_user, permission) =>
      ["assistance.view", "assistance.update", "appeal.view"].includes(permission));
    mocks.request.mockResolvedValue({
      ...request("CONVERTED_TO_APPEAL"),
      appealId: "synthetic-linked-appeal",
      appeal: { id: "synthetic-linked-appeal", title: "Synthetic medical appeal" },
    });
    const html = renderToStaticMarkup(await RequestDetailPage({
      params: Promise.resolve({ id: "synthetic-request" }),
    }));
    expect(html).toContain('href="/admin/appeals/synthetic-linked-appeal"');
    expect(html).toContain("Open appeal editor");
  });
  it("does not offer the linked appeal editor to staff without appeal.view", async () => {
    mocks.request.mockResolvedValue({
      ...request("CONVERTED_TO_APPEAL"),
      appealId: "synthetic-linked-appeal",
      appeal: { id: "synthetic-linked-appeal", title: "Synthetic medical appeal", status: "DRAFT" },
    });
    const html = renderToStaticMarkup(await RequestDetailPage({
      params: Promise.resolve({ id: "synthetic-request" }),
    }));
    expect(html).toContain("Linked appeal");
    expect(html).not.toContain('href="/admin/appeals/synthetic-linked-appeal"');
    expect(html).not.toContain("Open appeal editor");
  });
});


describe("verification field requirements", () => {
  it("distinguishes completion requirements, public fundraising requirements and optional notes without requiring a complete draft", async () => {
    const { html } = await statusOptions("SUBMITTED");
    expect(html).toContain("Required to approve");
    expect(html).toContain("Required for public fundraising only");
    expect(html).toMatch(/Other funding \/ duplication notes[\s\S]{0,60}Optional/);
    expect(html).toContain("Save review progress");
    expect(html).not.toContain('name="markComplete"');
    expect(html).toContain("Approval does not publish an appeal or transfer funds");
    const form = html.match(/<input[^>]*name="verifiedNeedAmount"[^>]*>/)?.[0];
    expect(form).toBeDefined();
    expect(form).not.toMatch(/\brequired(?:=|\s|>)/);
  });
});

describe("reviewer beneficiary residence evidence", () => {
  it.each([
    { residence: "HYDERABAD_SERVICE_AREA", expected: "In the Hyderabad service area" },
    { residence: "OUTSIDE_SERVICE_AREA", expected: "Outside the service area" },
    { residence: null, expected: "Not recorded — confirm beneficiary residence" },
    { residence: undefined, expected: "Not recorded — confirm beneficiary residence" },
    { residence: "UNKNOWN", expected: "Unrecognized answer — confirm beneficiary residence" },
    { residence: "", expected: "Unrecognized answer — confirm beneficiary residence" },
  ])("shows explicit evidence for residence $residence", async ({ residence, expected }) => {
    mocks.request.mockResolvedValue({ ...request("SUBMITTED"), beneficiaryResidence: residence });
    const html = renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }));
    expect(html).toContain("<dt>Beneficiary lives (self-declared)</dt><dd>" + expected + "</dd>");
    if (residence !== "OUTSIDE_SERVICE_AREA") expect(html).not.toContain("<dd>Outside the service area</dd>");
  });
});

describe("private support and closure evidence", () => {
  const render = () => RequestDetailPage({ params: Promise.resolve({ id: "synthetic-request" }) }).then(renderToStaticMarkup);
  it("distinguishes a closed appeal from delivery without an extra closure read", async () => {
    mocks.request.mockResolvedValue({ ...request("CONVERTED_TO_APPEAL"), acceptedAt: new Date("2026-10-28T00:00:00Z"),
      appealId: "synthetic-linked", appeal: { id: "synthetic-linked", title: "Synthetic appeal", status: "CLOSED" },
    });
    const html = await render();
    expect(html).toContain("Support and closure evidence");
    expect(html).toContain("<dt>Linked appeal status</dt><dd>Closed</dd>");
    expect(html).toContain("Request is not currently Closed");
    expect(html).toContain("Not established by these records.");
    expect(html).toContain("Completed approval verification needs review.");
    expect(mocks.history).toHaveBeenCalledOnce();
    expect(html).not.toContain('href="/admin/appeals/synthetic-linked"');
  });
  it("uses only the recorded transition for closed requests", async () => {
    mocks.request.mockResolvedValue({ ...request("CLOSED"), updatedAt: new Date("2026-11-26T00:00:00Z") });
    mocks.history.mockResolvedValueOnce([]).mockResolvedValueOnce([{ createdAt: new Date("2026-11-01T18:30:00Z") }]);
    const html = await render();
    expect(html).toContain("Latest recorded transition to Closed</dt><dd>2/11/2026");
    expect(html).toContain("Not established by these records.");
    expect(mocks.history).toHaveBeenCalledTimes(2);
    expect(mocks.history.mock.calls[1]?.[0]).toMatchObject({ where: { entityType: "AssistanceRequest", entityId: "synthetic-request", action: "assistance.updated" }, select: { createdAt: true }, take: 1 });
  });
  it("distinguishes a missing transition from an unavailable read and keeps the review usable", async () => {
    mocks.request.mockResolvedValue(request("CLOSED"));
    expect(await render()).toContain("No reliable closure transition on record");
    mocks.history.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
    const html = await render();
    expect(html).toContain("Closure evidence temporarily unavailable");
    expect(html).toContain("Review and decision");
    expect(html).not.toContain("PRIVATE_SYNTHETIC_DIAGNOSTIC");
  });
});
