import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrivateDocumentUrl } from "@/lib/storage";

type Props = { params: Promise<{ id: string }> };

const privateDocumentHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function GET(_: Request, { params }: Props) {
  const user = await requirePermission("assistance.view");
  const { id } = await params;
  const document = await prisma.assistanceDocument.findUnique({
    where: { id },
    select: { id: true, objectKey: true, assistanceRequestId: true },
  });
  if (!document) return new Response("Not found", { status: 404, headers: privateDocumentHeaders });

  const signedUrl = await getPrivateDocumentUrl(document.objectKey);
  await prisma.auditEvent.create({
    data: {
      actorId: user.id,
      action: "assistance.document_viewed",
      entityType: "AssistanceDocument",
      entityId: document.id,
      metadata: { assistanceRequestId: document.assistanceRequestId },
    },
  });

  return NextResponse.redirect(signedUrl, { status: 307, headers: privateDocumentHeaders });
}
