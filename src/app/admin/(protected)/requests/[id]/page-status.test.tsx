import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), staff: vi.fn(), history: vi.fn(), permission: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(async () => ({ id: "synthetic-staff" })),
  hasPermission: mocks.permission,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: mocks.request }, user: { findMany: mocks.staff },
  auditEvent: { findMany: mocks.history },
} }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("./actions", () => ({
  assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerification: vi.fn(), updateRequest: vi.fn(),
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

  it("preserves both approval choices for an approver", async () => {
    mocks.permission.mockReturnValue(true);
    const { options } = await statusOptions("APPROVED");
    expect(options.filter(option => option.selected).map(option => option.value)).toEqual(["APPROVED"]);
    expect(options.map(option => option.value)).toEqual(expect.arrayContaining(["APPROVED", "REJECTED"]));
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
