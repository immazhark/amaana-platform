import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), count: vi.fn(), documents: vi.fn(), events: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceDocument: { count: mocks.count, findMany: mocks.documents },
  auditEvent: { findMany: mocks.events },
} }));
vi.mock("./actions", () => ({ reviewDocumentRetention: vi.fn() }));

import RetentionReviewPage from "./page";

const formFields = ["decision", "reviewAfter", "deleteConfirmation", "reason"] as const;
const documentRows = ["synthetic-one", "synthetic-two"].map((id, index) => ({
  id,
  assistanceRequestId: `synthetic-request-${index + 1}`,
  originalName: `synthetic-${index + 1}.pdf`,
  mimeType: "application/pdf",
  sizeBytes: 1600,
  assistanceRequest: {
    referenceNumber: `AF-SYNTH-${index + 1}`,
    applicantName: "Synthetic applicant",
    status: "CLOSED",
    appeal: null,
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({});
  mocks.count.mockResolvedValue(2);
  mocks.documents.mockResolvedValue(documentRows);
  mocks.events.mockResolvedValue([]);
});

describe("private retention form accessible names", () => {
  it("gives all four controls a unique programmatically associated visible label in every row", async () => {
    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
    const forms = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].map(match => match[1] ?? "");
    expect(forms).toHaveLength(2);
    const allIds = new Set<string>();
    for (const form of forms) {
      for (const field of formFields) {
        const control = [...form.matchAll(/<(?:input|select|textarea)\b([^>]*)>/g)]
          .map(match => match[1] ?? "")
          .find(attributes => new RegExp(`(?:^|\\s)name="${field}"(?:\\s|/|$)`).test(attributes));
        expect(control, `Missing control for ${field}`).toBeDefined();
        const id = control?.match(/(?:^|\s)id="([^"]+)"/)?.[1];
        expect(id, `Missing id for ${field}`).toBeTruthy();
        expect(allIds.has(id!), `Duplicate id ${id}`).toBe(false);
        allIds.add(id!);
        const label = [...form.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)]
          .find(match => (match[1] ?? "").includes(`for="${id}"`));
        expect(label?.[2]?.replace(/<[^>]+>/g, " ").trim(), `Missing label for ${field}`).toBeTruthy();
      }
    }
    expect(allIds.size).toBe(8);
    expect(mocks.permission).toHaveBeenCalledWith("assistance.approve");
  });
});

describe("retention hold timestamp safety", () => {
  it("shows a reconciliation notice and disables submission for opposing events with the same timestamp", async () => {
    const createdAt = new Date("2026-10-28T08:00:00.000Z");
    mocks.documents.mockResolvedValue([documentRows[0]]);
    mocks.events.mockResolvedValue([
      { id: "hold-release", action: "assistance.document_legal_hold_released", createdAt,
        metadata: { documentId: "synthetic-one" }, actor: { name: "Synthetic reviewer" } },
      { id: "hold-placement", action: "assistance.document_legal_hold_placed", createdAt,
        metadata: { documentId: "synthetic-one" }, actor: { name: "Synthetic reviewer" } },
    ]);

    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("HOLD REVIEW REQUIRED");
    expect(html).toContain("Hold history requires reconciliation");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Record retention decision<\/button>/);
  });
});


describe("retention selected-state query", () => {
  it.each(["eligible", "active"])("applies the %s count predicate to the bounded document list", async state => {
    mocks.documents.mockResolvedValue([]);
    await RetentionReviewPage({ searchParams: Promise.resolve({ state }) });
    const countQuery = mocks.count.mock.calls[0]?.[0];
    const terminal = { OR: [
      { assistanceRequest: { status: { in: ["CLOSED", "REJECTED"] } } },
      { assistanceRequest: { appeal: { status: "CLOSED" } } },
    ] };
    expect(countQuery?.where).toEqual(state === "eligible" ? terminal : { NOT: terminal });
    expect(mocks.documents).toHaveBeenCalledWith(expect.objectContaining({
      where: countQuery.where,
      skip: 0,
      take: 50,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }));
    expect(mocks.events).not.toHaveBeenCalled();
  });

  it("preserves the selected predicate on a later bounded page", async () => {
    mocks.count.mockResolvedValue(51);
    mocks.documents.mockResolvedValue([]);
    await RetentionReviewPage({ searchParams: Promise.resolve({ state: "eligible", page: "2" }) });
    expect(mocks.documents).toHaveBeenCalledWith(expect.objectContaining({
      where: mocks.count.mock.calls[0]?.[0]?.where, skip: 50, take: 50,
    }));
  });

  it.each([undefined, "invalid"])("keeps the unfiltered view for state %s", async state => {
    mocks.documents.mockResolvedValue([]);
    await RetentionReviewPage({ searchParams: Promise.resolve({ state }) });
    expect(mocks.count.mock.calls[0]?.[0]?.where).toBeUndefined();
    expect(mocks.documents.mock.calls[0]?.[0]?.where).toBeUndefined();
  });
});


describe("retention empty-view recovery", () => {
  it.each(["eligible", "active"])("does not claim global absence for an empty %s view", async state => {
    mocks.count.mockReset().mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce(state === "eligible" ? 0 : 2);
    mocks.documents.mockResolvedValue([]);
    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({ state }) }));
    expect(html).toContain("No private assistance documents match this workflow state.");
    expect(html).not.toContain("No private assistance documents are currently stored.");
    expect(html).toMatch(/href="\/admin\/retention"[^>]*>View all documents<\/a>/);
    expect(html).toContain("All (2)");
    expect(mocks.events).not.toHaveBeenCalled();
  });

  it("keeps the global empty explanation when there is no filter", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.documents.mockResolvedValue([]);
    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("No private assistance documents are currently stored.");
    expect(html).not.toContain("View all documents");
  });
});
