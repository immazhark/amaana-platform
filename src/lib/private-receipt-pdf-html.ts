import type { AcknowledgementRecord } from "@/lib/private-record-response";

const LABELS: Record<string, string> = {
  GENERAL: "General giving",
  SADAQAH: "Sadaqah",
  ZAKAT: "Zakat",
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function money(amount: number): string {
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(paise) ||
      Math.abs(amount - paise / 100) > Number.EPSILON * Math.max(1, amount) * 2) {
    throw new Error("Invalid private receipt monetary precision");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(paise / 100);
}

/** Self-contained, escaped HTML for an offline Unicode-capable print engine.
 * Never add remote fonts, scripts, links or images to this document. */
export function renderPrivateReceiptHtml(record: AcknowledgementRecord): string {
  const { donation, presentation } = record;
  if (record.found !== true || !donation.receiptNumber ||
      !["captured", "refunded"].includes(presentation.tone)) {
    throw new Error("Only settled donations with an acknowledgement may be printed");
  }
  if (donation.refundedAmount > donation.amount ||
      (presentation.tone === "refunded" && donation.refundedAmount !== donation.amount)) {
    throw new Error("Inconsistent refunded receipt accounting");
  }
  const date = new Date(donation.recordDate);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid receipt date");
  const day = date.toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  const row = (label: string, value: string) =>
    `<div class="field"><dt>${label}</dt><dd><bdi dir="auto">${escapeHtml(value)}</bdi></dd></div>`;
  const rows = [
    row("Donation reference", donation.referenceNumber),
    row("Acknowledgement number", donation.receiptNumber),
    row("Donor", donation.donorName),
    row(donation.designationKind === "FUND" ? "Designated giving fund" : "Designated appeal", donation.appeal.title),
    row("Giving intention", LABELS[donation.givingIntent] ?? donation.givingIntent),
    row("Original amount", money(donation.amount)),
    ...(donation.refundedAmount > 0 ? [row("Refunded amount", money(donation.refundedAmount))] : []),
    row("Payment status", presentation.statusLabel),
    row("Record date", day),
    row("Payment reference", donation.providerPaymentId ?? "Not applicable"),
  ];
  return `<!doctype html>
<html lang="en-IN"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Private transaction record</title>
<style>
@page { size: A4; margin: 18mm; }
html,body{margin:0;padding:0;color:#122239;background:#fff;font-family:"Noto Sans","Noto Sans Telugu","Noto Naskh Arabic","DejaVu Sans",sans-serif;font-size:12px;line-height:1.65}
header{border-bottom:3px solid #B58A38;padding-bottom:15px;margin-bottom:26px}
.brand{color:#075b4d;font-weight:800;font-size:24px;letter-spacing:.12em}
.kicker{color:#84602b;font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin:4px 0 0}
h1{font-size:22px;line-height:1.3;margin:20px 0 7px}p{margin:8px 0}
.status{color:#075b4d;font-weight:700;font-size:13px;margin-bottom:20px}
dl{margin:0;border:1px solid #dbe3e5;border-radius:8px;overflow:hidden}
.field{display:grid;grid-template-columns:39% 61%;border-bottom:1px solid #e5e9ec;break-inside:avoid;page-break-inside:avoid}
.field:last-child{border-bottom:0}dt,dd{padding:9px 13px;margin:0;overflow-wrap:anywhere;white-space:pre-wrap}
dt{background:#f5f8f7;color:#4c5e65;font-weight:600}dd{font-weight:500}bdi{unicode-bidi:isolate}
.notice{margin-top:24px;padding:15px;border-left:4px solid #B58A38;background:#f9f7f1;break-inside:avoid}
.notice strong{display:block}.notice p{margin:5px 0 0}
footer{margin-top:28px;border-top:1px solid #dbe3e5;padding-top:12px;font-size:10px;color:#52606a}
</style></head><body>
<header><div class="brand">AMAANA FOUNDATION</div><p class="kicker">Upholding Trust · Serving with Dignity</p></header>
<main><h1>Private donation acknowledgement</h1>
<p class="status">${escapeHtml(presentation.statusLabel)}</p>
<dl>${rows.join("\n")}</dl>
<section class="notice"><strong>Important — normal donation acknowledgement</strong>
<p>This document records the status of a donation. It does not certify eligibility for a deduction under Section 80G and is not a statutory Form 10BE certificate.</p></section></main>
<footer>Keep this record private. For discrepancies, contact Amaana Foundation and quote your donation reference. Never share OTPs, card credentials or UPI PINs.</footer>
</body></html>`;
}
