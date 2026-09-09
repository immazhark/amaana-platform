import { timingSafeEqual } from "node:crypto";
import { hashTrackingToken } from "@/lib/assistance";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ reference?: string; token?: string }> };
const statusLabels: Record<string, string> = { SUBMITTED: "Submitted", DOCUMENTS_REQUESTED: "Documents requested", UNDER_VERIFICATION: "Under verification", APPROVED: "Approved", REJECTED: "Not approved", CONVERTED_TO_APPEAL: "Converted to appeal", CLOSED: "Closed" };

export default async function StatusPage({ searchParams }: Props) {
  const { reference, token } = await searchParams;
  let record: { status: string; createdAt: Date; updatedAt: Date } | null = null;
  if (reference && token) {
    const candidate = await prisma.assistanceRequest.findUnique({ where: { referenceNumber: reference }, select: { trackingTokenHash: true, status: true, createdAt: true, updatedAt: true } });
    const supplied = Buffer.from(hashTrackingToken(token));
    const expected = Buffer.from(candidate?.trackingTokenHash ?? "0".repeat(64));
    if (candidate && supplied.length === expected.length && timingSafeEqual(supplied, expected)) record = candidate;
  }
  return <section className="section"><div className="container"><div className="card form-card"><p className="eyebrow">Request status</p><h1>{record ? statusLabels[record.status] ?? record.status : "Tracking link unavailable"}</h1>{record ? <><p className="reference">Reference: <strong>{reference}</strong></p><p>Submitted {record.createdAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</p><p className="muted">We will contact you using the details supplied if the request progresses or more information is needed.</p></> : <p className="lead">This link is incomplete, invalid or no longer available.</p>}</div></div></section>;
}
