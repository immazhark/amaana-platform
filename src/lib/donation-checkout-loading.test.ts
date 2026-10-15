import { createElement, Suspense } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { LazyDonationForm, LazyDirectTransferForm } from "@/components/donation-checkout-loaders";
import { LazyDonationMethods } from "@/components/lazy-donation-methods";
import { DonationOptions } from "@/components/donation-options";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
function html(element: React.ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const destination = new PassThrough();
    const chunks: Buffer[] = [];
    destination.on("data", chunk => chunks.push(Buffer.from(chunk)));
    destination.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    destination.on("error", reject);
    const { pipe } = renderToPipeableStream(createElement(Suspense, { fallback: "Preparing checkout" }, element), {
      onAllReady() { pipe(destination); }, onError: reject,
    });
  });
}
const appeal = { appealId: "synthetic-appeal", appealTitle: "Synthetic approved need", maxAmount: 400, zakatEligible: false };
describe("shared async checkout module boundaries preserve real forms", () => {
  it("renders all payment-method controls and the real online form through the shared lazy boundary", async () => {
    const output = await html(createElement(LazyDonationMethods, { ...appeal, bankAvailable: false, paymentInstructions: { DIRECT_UPI: null, BANK_TRANSFER: null } }));
    expect(output).toContain("Secure online payment"); expect(output).toContain("Direct UPI / QR"); expect(output).toContain("Bank transfer");
    expect(output).toContain('name="donorName"'); expect(output).toContain('name="domesticConfirmed"'); expect(output).toContain("Maximum available for this transaction: ₹400.");
  });
  it("preserves receipt/privacy and original-purpose controls on the real giving-fund form", async () => {
    const output = await html(createElement(LazyDonationForm, {
      maxAmount: 100,
      fund: { id: "synthetic-fund", revision: 1, name: "Education supplies", purpose: "Reviewed educational supply use.", disclosure: "Original approved use only.", acceptedIntents: ["GENERAL"] },
    }));
    expect(output).toContain("Original approved use only."); expect(output).toContain('name="fundPurposeConfirmed"');
    expect(output).toContain('name="domesticConfirmed"'); expect(output).toContain('name="isAnonymous"');
  });
  it("loads the actual direct-transfer form without weakening its pending-verification disclosure", async () => {
    const output = await html(createElement(LazyDirectTransferForm, { appealId: appeal.appealId, maxAmount: 400, zakatEligible: false, method: "DIRECT_UPI", instructions: "Synthetic approved instructions", bankAvailable: false }));
    expect(output).toContain("Synthetic approved instructions"); expect(output).toContain("Pending Verification"); expect(output).toContain('name="transferReference"');
  });
  it("server entry points resolve the same nested checkout forms instead of leaving only a loading placeholder", async () => {
    const output = await html(createElement(DonationOptions, { ...appeal, paymentDetails: { upi: { id: "synthetic@upi", qrImageUrl: null }, bank: null } }));
    expect(output).toContain('name="donorName"'); expect(output).toContain('name="donorEmail"'); expect(output).toContain("Maximum available for this transaction: ₹400.");
  });
});
