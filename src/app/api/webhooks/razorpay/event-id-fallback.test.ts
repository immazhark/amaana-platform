vi.mock("@/lib/donation-cache", () => ({ expireDonationViews: vi.fn() }));
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { paymentEvent: db } }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/razorpay", () => ({ verifyWebhookSignature: () => true }));

import { POST } from "./route";

describe("signed webhook event identity fallback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.findUnique.mockResolvedValue(null);
    db.create.mockResolvedValue({ id: "event-test" });
  });

  it.each(["", " ", "   "])("hashes signed bodies for a blank event-id header %j", async suppliedId => {
    const rawBody = JSON.stringify({ event: "synthetic.audit", marker: suppliedId });
    const response = await POST(new Request("https://amaana.example/api/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": "synthetic", "x-razorpay-event-id": suppliedId },
      body: rawBody,
    }));
    const expected = createHash("sha256").update(rawBody).digest("hex");

    expect(response.status).toBe(200);
    expect(db.findUnique).toHaveBeenCalledWith({
      where: { providerEventId: expected },
      select: { id: true, eventType: true, payload: true },
    });
    expect(db.create).toHaveBeenCalledWith({ data: {
      providerEventId: expected,
      eventType: "synthetic.audit",
      payload: expect.objectContaining({ event: "synthetic.audit" }),
    } });
  });
});
