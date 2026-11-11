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


it("announces both private document tabs while preserving each record link", async () => {
  const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
  for (const document of documentRows) {
    const anchor = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]).find(link => link.includes(`href="/admin/documents/${document.id}"`));
    expect(anchor).toContain('target="_blank"');
    expect(anchor).toContain('rel="noreferrer"');
    expect(anchor).toContain('Open private document ↗<span class="sr-only"> (opens in a new tab)</span>');
  }
});


describe("retention review-after date on non-India servers", () => {
  it.each([
    ["2027-01-01T00:00:00.000Z", "1/1/2027"],
    ["2027-06-01T00:00:00.000Z", "1/6/2027"],
  ])("preserves the selected India review day for %s", async (reviewAfter, expectedDay) => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    try {
      mocks.documents.mockResolvedValue([documentRows[0]]);
      mocks.events.mockResolvedValue([{
        id: "synthetic-review",
        entityType: "AssistanceRequest",
        entityId: "synthetic-request-1",
        action: "assistance.document_retention_reviewed",
        metadata: { documentId: "synthetic-one", reason: "Synthetic reason", reviewAfter },
        createdAt: new Date("2026-12-31T18:31:00.000Z"),
        actor: { name: "Synthetic reviewer" },
      }]);
      const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
      expect(html).toContain(`review after ${expectedDay}`);
      expect(mocks.permission).toHaveBeenCalledWith("assistance.approve");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("private retention page authorization precedes all evidence queries", () => {
  it.each([
    { caseName: "anonymous", message: "Authentication required", params: {} },
    { caseName: "wrong role in eligible view", message: "Permission denied", params: { state: "eligible" } },
    { caseName: "expired session in active view", message: "Session expired", params: { state: "active", page: "2" } },
    { caseName: "revoked reviewer on later page", message: "Access revoked", params: { page: "3" } },
    { caseName: "malformed filter", message: "Authentication required", params: { state: "unrecognized", page: "-9" } },
    { caseName: "far-page query", message: "Permission denied", params: { state: "eligible", page: "999999" } },
  ])("blocks $caseName before database access", async ({ message, params }) => {
    mocks.permission.mockRejectedValueOnce(new Error(message));

    await expect(RetentionReviewPage({ searchParams: Promise.resolve(params) })).rejects.toThrow(message);

    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.approve");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.documents).not.toHaveBeenCalled();
    expect(mocks.events).not.toHaveBeenCalled();
  });

  it("does not start any private query while permission verification is pending", async () => {
    let grantPermission: ((value: { id: string }) => void) | undefined;
    const pendingPermission = new Promise<{ id: string }>(resolve => {
      grantPermission = resolve;
    });
    mocks.permission.mockReturnValueOnce(pendingPermission);
    mocks.documents.mockResolvedValue([]);

    const render = RetentionReviewPage({ searchParams: Promise.resolve({ state: "eligible" }) });

    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.documents).not.toHaveBeenCalled();
    expect(mocks.events).not.toHaveBeenCalled();

    if (!grantPermission) throw new Error("Permission test promise was not initialised");
    grantPermission({ id: "synthetic-reviewer" });
    await render;

    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.approve");
    expect(mocks.count).toHaveBeenCalledTimes(3);
    expect(mocks.documents).toHaveBeenCalledTimes(1);
    expect(mocks.events).not.toHaveBeenCalled();
  });
});
