import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  reconcile: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/direct-donation-reconciliation", () => ({ reconcileDirectDonation: mocks.reconcile }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { reconcileDonationAction } from "./actions";

function validForm() {
  const form = new FormData();
  form.set("donationId", "donation_01");
  form.set("decision", "VERIFY");
  form.set("notes", "Bank reference matched");
  return form;
}

describe("admin transfer reconciliation form boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.permission.mockResolvedValue({ id: "reviewer_01" });
    mocks.reconcile.mockResolvedValue(undefined);
  });

  it("reconciles one unambiguous authorized request", async () => {
    await reconcileDonationAction(validForm());
    expect(mocks.permission).toHaveBeenCalledWith("donation.reconcile");
    expect(mocks.reconcile).toHaveBeenCalledOnce();
    expect(mocks.reconcile).toHaveBeenCalledWith({
      donationId: "donation_01",
      actorId: "reviewer_01",
      decision: "VERIFY",
      notes: "Bank reference matched",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/donations");
  });

  it.each(["donationId", "decision", "notes"])(
    "rejects duplicate %s fields before changing donation state", async field => {
      const form = validForm();
      form.append(field, field === "decision" ? "REJECT" : "forged alternative");
      await expect(reconcileDonationAction(form)).rejects.toThrow(/repeated|single/i);
      expect(mocks.reconcile).not.toHaveBeenCalled();
      expect(mocks.revalidate).not.toHaveBeenCalled();
    },
  );

  it.each(["donationId", "decision", "notes"])(
    "rejects a file in scalar %s fields", async field => {
      const form = validForm();
      form.set(field, new File(["forged"], "payload.txt", { type: "text/plain" }));
      await expect(reconcileDonationAction(form)).rejects.toThrow(/single text/i);
      expect(mocks.reconcile).not.toHaveBeenCalled();
    },
  );

  it.each(["", "  ", "no", "a".repeat(1001)])(
    "rejects missing or invalid reconciliation notes before financial mutation", async notes => {
      const form = validForm();
      if (!notes) form.delete("notes");
      else form.set("notes", notes);
      await expect(reconcileDonationAction(form)).rejects.toThrow(/notes.*3.*1000/i);
      expect(mocks.reconcile).not.toHaveBeenCalled();
    },
  );

  it("rejects unsupported decisions without financial mutation", async () => {
    const invalid = validForm();
    invalid.set("decision", "APPROVE_WITHOUT_REVIEW");
    await expect(reconcileDonationAction(invalid)).rejects.toThrow("Invalid reconciliation request");
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });

  it("accepts the minimum valid note length", async () => {
    const form = validForm();
    form.set("notes", "yes");
    await reconcileDonationAction(form);
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.objectContaining({ notes: "yes" }));
  });
});
