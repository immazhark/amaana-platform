import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrivateDocumentUrl } from "@/lib/storage";

type Props = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Props) {
  await requirePermission("assistance.view"); const { id } = await params;
  const document = await prisma.assistanceDocument.findUnique({ where: { id } });
  if (!document) return new Response("Not found", { status: 404 });
  redirect(await getPrivateDocumentUrl(document.objectKey));
}
