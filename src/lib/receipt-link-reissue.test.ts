import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: async (work: (tx: unknown) => Promise<unknown>) =>
    work({ donation: { findUnique: db.findUnique, update: db.update }, auditEvent: { create: db.audit } }),
}));

import { hashReceiptToken } from "@/lib/donations";
import { parsePrivateDonationAcknowledgementLocation } from "@/lib/private-donation-ack-location";
import { ReceiptLinkError, reissueReceiptLink } from "./receipt-link-reissue";

const input = { donationId: "synthetic-donation", actorId: "synthetic-staff", reason: "Donor lost the link and confirmed by phone" };

beforeEach(() => {
  vi.clearAllMocks();
  db.findUnique.mockResolvedValue({ id: "synthetic-donation", referenceNumber: "AFD-SYNTHETIC-0001" });
  db.update.mockResolvedValue({});
  db.audit.mockResolvedValue({});
});

describe("staff reissue of a private acknowledgement link", () => {
  it("replaces the stored hash with the hash of the token in the returned link, so the old link stops working", async () => {
    const result = await reissueReceiptLink(input);
    const token = parsePrivateDonationAcknowledgementLocation("", result.path.slice(result.path.indexOf("#")));
    expect(token).toBeTruthy();
    expect(db.update).toHaveBeenCalledWith({ where: { id: "synthetic-donation" }, data: { receiptTokenHash: hashReceiptToken(token!) } });
    expect(result.path).toMatch(/^\/donations\/AFD-SYNTHETIC-0001\/acknowledgement#token=/);
    expect(result.referenceNumber).toBe("AFD-SYNTHETIC-0001");
  });

  it("issues a different token every time", async () => {
    const first = await reissueReceiptLink(input);
    const second = await reissueReceiptLink(input);
    expect(first.path).not.toBe(second.path);
  });

  it("records who reissued which donation and why, and never the token or its hash", async () => {
    const result = await reissueReceiptLink(input);
    const token = parsePrivateDonationAcknowledgementLocation("", result.path.slice(result.path.indexOf("#")))!;
    expect(db.audit).toHaveBeenCalledOnce();
    const { data } = db.audit.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(data).toEqual({ actorId: "synthetic-staff", action: "donation.receipt_link.reissue", entityType: "Donation", entityId: "synthetic-donation", metadata: { reason: input.reason } });
    const written = JSON.stringify([data, db.update.mock.calls[0]![0].data.receiptTokenHash === hashReceiptToken(token) ? [] : "mismatch"]);
    expect(written).not.toContain(token);
    expect(written).not.toContain(hashReceiptToken(token));
  });

  it("refuses an unknown donation without changing anything", async () => {
    db.findUnique.mockResolvedValue(null);
    await expect(reissueReceiptLink(input)).rejects.toThrow(new ReceiptLinkError("Donation not found."));
    expect(db.update).not.toHaveBeenCalled();
    expect(db.audit).not.toHaveBeenCalled();
  });

  it.each([["", "too short"], ["ab", "too short"], ["x".repeat(301), "too long"]])("refuses a reason that is %#: %s", async reason => {
    await expect(reissueReceiptLink({ ...input, reason })).rejects.toBeInstanceOf(ReceiptLinkError);
    expect(db.findUnique).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("requires a donation and a signed-in actor", async () => {
    await expect(reissueReceiptLink({ ...input, donationId: "" })).rejects.toBeInstanceOf(ReceiptLinkError);
    await expect(reissueReceiptLink({ ...input, actorId: "" })).rejects.toBeInstanceOf(ReceiptLinkError);
    expect(db.update).not.toHaveBeenCalled();
  });
});
