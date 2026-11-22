import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { summariseDonationFunnel } from "@/lib/donation-funnel";
import { AdminDonationFunnel } from "./admin-donation-funnel";

const render = (groups: Parameters<typeof summariseDonationFunnel>[0]) => renderToStaticMarkup(<AdminDonationFunnel rows={summariseDonationFunnel(groups)} windowDays={90} />);
const group = (paymentMethod: "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER", status: Parameters<typeof summariseDonationFunnel>[0][number]["status"], count: number) => ({ paymentMethod, status, _count: { _all: count } });

describe("AdminDonationFunnel", () => {
  it("shows an all-methods row beside the per-method rows when nothing is hidden", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 40), group("RAZORPAY", "FAILED", 10), group("BANK_TRANSFER", "CAPTURED", 12), group("BANK_TRANSFER", "PENDING_VERIFICATION", 8)]);
    expect(html).toContain("All methods");
    expect(html).toContain("80%");
    expect(html).not.toContain("withheld to protect small counts");
  });

  it("never prints a count below the minimum, and withholds the all-methods row and the share when something is hidden", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 40), group("DIRECT_UPI", "CAPTURED", 2), group("DIRECT_UPI", "PENDING_VERIFICATION", 9)]);
    expect(html).toContain("withheld to protect small counts");
    expect(html).not.toContain("All methods");
    expect(html).not.toMatch(/>2</);
  });

  it("never lets a hidden cell be recovered from the rest of its row, and never calls a large count small", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 3), group("RAZORPAY", "PENDING_VERIFICATION", 30), group("RAZORPAY", "FAILED", 7)]);
    // Confirmed (3) is small, so unsuccessful (7) is withheld with it: neither can be worked out from the visible 40 and 30.
    expect(html).not.toMatch(/>3</);
    expect(html).not.toMatch(/>7</);
    expect(html).toContain(">40<");
    expect(html).toContain(">30<");
    expect(html.match(/withheld to protect small counts/g)).toHaveLength(2);
    expect(html).not.toContain("&lt;5");
  });

  it("labels every column and carries a table caption for screen readers", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 40), group("RAZORPAY", "FAILED", 10)]);
    for (const label of ["Payment method", "Started", "Awaiting payment or verification", "Confirmed", "Unsuccessful", "Confirmed share"]) expect(html).toContain(`>${label}</th>`);
    expect(html).toContain("Donation outcomes by payment method, last 90 days");
    expect(html).toContain('aria-labelledby="donation-funnel-heading"');
  });

  it("makes the scrollable table a labelled, keyboard-focusable region so it can be scrolled without a mouse", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 40), group("RAZORPAY", "FAILED", 10)]);
    expect(html).toMatch(/<div class="admin-table-wrap" tabindex="0" role="region" aria-label="Donation outcomes by payment method, last 90 days">/);
  });

  it("states what it counts from and what it does not show", () => {
    const html = render([group("RAZORPAY", "CAPTURED", 40)]);
    expect(html).toContain("Counted from recorded payment status, not from browser activity");
    expect(html).toContain("This does not show where donors came from.");
  });

  it("shows an honest empty state", () => {
    expect(render([])).toContain("No donations were started in this period.");
  });
});
