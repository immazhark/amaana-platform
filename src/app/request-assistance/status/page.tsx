import type { Metadata } from "next";
import Link from "next/link";
import { timingSafeEqual } from "node:crypto";
import { hashTrackingToken } from "@/lib/assistance";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Private Assistance Request Tracking",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ reference?: string; token?: string }> };
const statusLabels: Record<string, string> = { SUBMITTED: "Submitted", DOCUMENTS_REQUESTED: "Documents requested", UNDER_VERIFICATION: "Under verification", APPROVED: "Approved", REJECTED: "Not approved", CONVERTED_TO_APPEAL: "Converted to appeal", CLOSED: "Closed" };
const statusCopy: Record<string, string> = {
  SUBMITTED: "Your request has been received and is waiting for review.",
  DOCUMENTS_REQUESTED: "The team needs additional supporting information before review can continue.",
  UNDER_VERIFICATION: "The information supplied is currently being reviewed and verified.",
  APPROVED: "The request has passed the current review stage. The team will communicate the next step directly.",
  REJECTED: "The request was not approved. Any available explanation or follow-up will be communicated through the contact details supplied.",
  CONVERTED_TO_APPEAL: "The request has progressed into Amaana’s approved appeal workflow.",
  CLOSED: "This request is now closed.",
};

export default async function StatusPage({ searchParams }: Props) {
  const { reference, token } = await searchParams;
  let record: { status: string; createdAt: Date; updatedAt: Date } | null = null;
  if (reference && token) {
    const candidate = await prisma.assistanceRequest.findUnique({ where: { referenceNumber: reference }, select: { trackingTokenHash: true, status: true, createdAt: true, updatedAt: true } });
    const supplied = Buffer.from(hashTrackingToken(token));
    const expected = Buffer.from(candidate?.trackingTokenHash ?? "0".repeat(64));
    if (candidate && supplied.length === expected.length && timingSafeEqual(supplied, expected)) record = candidate;
  }

  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid"><div><p className="v2-section-label">Private request tracking</p><h1>{record ? statusLabels[record.status] ?? record.status : "Tracking link unavailable"}</h1>{record ? <><p>{statusCopy[record.status] ?? "Your request status has been updated."}</p><div className="v2-reference-block"><span>Reference</span><strong>{reference}</strong><small>Submitted {record.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })} · Last updated {record.updatedAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</small></div></> : <p>This tracking link is incomplete, invalid or no longer available. For privacy, no request details are shown without a valid reference and token.</p>}<div className="v2-hero-actions"><Link className="v2-button" href="/request-assistance">Request assistance</Link><Link className="v2-text-link" href="/how-we-verify">Understand the review process →</Link></div></div><aside className="v2-state-steps"><span>Review path</span><ol><li><b>01</b><div><strong>Submitted</strong><p>Request and consent recorded.</p></div></li><li><b>02</b><div><strong>Verification</strong><p>Details and relevant supporting information reviewed.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>Outcome communicated without exposing private material.</p></div></li></ol></aside></div></section></div>;
}
