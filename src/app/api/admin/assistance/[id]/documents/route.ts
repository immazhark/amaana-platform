import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { canReportPrivateDelivery } from "@/lib/assistance-delivery";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { isSameOrigin } from "@/lib/request-security";
import {
  MAX_FILE_BYTES, PrivateDocumentValidationError,
  deletePrivateDocumentObject, uploadPrivateDocument,
} from "@/lib/storage";
import { logServerError } from "@/lib/server-log";

export const runtime = "nodejs";
const MAX_BODY_BYTES = MAX_FILE_BYTES + 128 * 1024;
const MAX_CASE_DOCUMENTS = 30;
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};
type Props = { params: Promise<{ id: string }> };
const failure = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: privateHeaders });

/** Upload a single delivery-proof document into the existing private case
 * evidence store. Never send it to public media, an appeal or the donor ledger.
 * The reporter subsequently links this record to an unreviewed delivery. */
export async function POST(request: Request, { params }: Props) {
  if (!isSameOrigin(request)) return failure("Invalid request origin.", 403);
  const user = await getCurrentUser();
  if (!user) return failure("Authentication required.", 401);
  if (!hasPermission(user, "assistance.view") || !hasPermission(user, "assistance.update")) {
    return failure("Assistance update permission is required.", 403);
  }
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{3,128}$/.test(id)) return failure("Invalid case reference.", 400);
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return failure("Upload must contain a single private document.", 415);
  }
  let file: File;
  try {
    const body = await readBodyBytesWithLimit(request, MAX_BODY_BYTES, { timeoutMs: 20_000 });
    const form = await new Response(body, { headers: { "Content-Type": contentType } }).formData();
    const entries = form.getAll("document");
    if (entries.length !== 1 || !(entries[0] instanceof File)) {
      return failure("Choose exactly one supporting document.", 400);
    }
    file = entries[0];
    if (!file.name || file.size === 0 || file.size > MAX_FILE_BYTES) {
      return failure("Choose one non-empty document no larger than 5 MB.", 400);
    }
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return failure("The document exceeds the 5 MB upload limit.", 413);
    }
    return failure("Could not read the private document.", 400);
  }

  // Read eligibility before touching object storage. Only a case with pending
  // delivery evidence review may accept more private delivery documents.
  const caseRecord = await prisma.assistanceRequest.findUnique({
    where: { id },
    select: {
      status: true, appealId: true,
      verification: { select: { decision: true, completedAt: true } },
      _count: { select: { documents: true } },
      deliveryRecords: {
        where: { state: "REPORTED", reportedById: user.id, evidenceDocumentId: null },
        select: { id: true }, take: 1,
      },
    },
  });
  if (!caseRecord || !canReportPrivateDelivery(caseRecord.status, caseRecord.appealId, caseRecord.verification) ||
      caseRecord.deliveryRecords.length === 0) {
    return failure("Only the reporter of an unreviewed delivery missing proof can upload new evidence.", 409);
  }
  if (caseRecord._count.documents >= MAX_CASE_DOCUMENTS) {
    return failure("This case reached the private evidence limit. Ask an administrator for review.", 409);
  }

  let saved: Awaited<ReturnType<typeof uploadPrivateDocument>>;
  try {
    saved = await uploadPrivateDocument(file, id);
  } catch (error) {
    if (error instanceof PrivateDocumentValidationError) return failure(error.message, 400);
    logServerError("assistance.delivery_proof_storage_failed");
    return failure("Private document storage is unavailable.", 503);
  }

  try {
    const document = await withSerializableTransactionRetry(async tx => {
      const current = await tx.assistanceRequest.findUnique({
        where: { id },
        select: {
          status: true, appealId: true,
          verification: { select: { decision: true, completedAt: true } },
          _count: { select: { documents: true } },
          deliveryRecords: {
            where: { state: "REPORTED", reportedById: user.id, evidenceDocumentId: null },
            select: { id: true }, take: 1,
          },
        },
      });
      if (!current || !canReportPrivateDelivery(current.status, current.appealId, current.verification) ||
          current.deliveryRecords.length === 0 || current._count.documents >= MAX_CASE_DOCUMENTS) {
        throw new Error("CASE_NOT_ELIGIBLE");
      }
      const record = await tx.assistanceDocument.create({
        data: { assistanceRequestId: id, ...saved },
        select: { id: true },
      });
      await tx.auditEvent.create({ data: {
        actorId: user.id,
        action: "assistance.delivery_private_evidence_uploaded",
        entityType: "AssistanceRequest", entityId: id,
        metadata: { documentId: record.id },
      } });
      return record;
    });
    return NextResponse.json({ documentId: document.id },
      { status: 201, headers: privateHeaders });
  } catch {
    // An uncertain DB acknowledgement must never cause deletion of a file
    // that is already referenced by the case or its audit history.
    try {
      const persisted = await prisma.assistanceDocument.findUnique({
        where: { objectKey: saved.objectKey }, select: { id: true },
      });
      if (persisted) {
        return NextResponse.json({ documentId: persisted.id },
          { status: 201, headers: privateHeaders });
      }
    } catch {
      logServerError("assistance.delivery_proof_commit_uncertain");
      return failure("Upload outcome is uncertain. Refresh before uploading again.", 503);
    }
    try {
      await deletePrivateDocumentObject(saved.objectKey, id);
    } catch {
      logServerError("assistance.delivery_proof_orphan_cleanup_failed");
    }
    return failure("Evidence could not be attached to this case. No delivery was confirmed.", 409);
  }
}
