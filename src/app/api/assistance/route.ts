import { AppealCategory, NotificationChannel } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assistanceSchema, createReferenceNumber, createTrackingToken, hashTrackingToken } from "@/lib/assistance";
import { RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { prisma } from "@/lib/prisma";
import { deletePrivateDocumentObject, MAX_FILE_BYTES, MAX_FILES, uploadPrivateDocument } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";
import { enforceAssistanceRateLimit, isSameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const ASSISTANCE_MULTIPART_OVERHEAD_BYTES = 512 * 1024;
const MAX_ASSISTANCE_MULTIPART_BYTES = MAX_FILES * MAX_FILE_BYTES + ASSISTANCE_MULTIPART_OVERHEAD_BYTES;

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();

    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: privateHeaders });
    }

    if (!(await enforceAssistanceRateLimit(request))) {
      return NextResponse.json(
        { error: "Too many assistance requests were submitted from this connection. Please wait before trying again." },
        { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      return NextResponse.json({ error: "Invalid assistance submission format." }, { status: 400, headers: privateHeaders });
    }

    let formData: FormData;
    try {
      const bodyBytes = await readBodyBytesWithLimit(request, MAX_ASSISTANCE_MULTIPART_BYTES);
      formData = await new Response(bodyBytes, { headers: { "Content-Type": contentType } }).formData();
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json(
          { error: "The assistance submission is too large. Upload no more than five documents of up to 5 MB each." },
          { status: 413, headers: privateHeaders },
        );
      }
      return NextResponse.json({ error: "Invalid assistance submission format." }, { status: 400, headers: privateHeaders });
    }

    const parsed = assistanceSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the highlighted information and try again.", fields: parsed.error.flatten().fieldErrors },
        { status: 400, headers: privateHeaders },
      );
    }

    const files = formData.getAll("documents").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload up to ${MAX_FILES} documents.` }, { status: 400, headers: privateHeaders });
    }

    const id = randomUUID();
    const documents: Awaited<ReturnType<typeof uploadPrivateDocument>>[] = [];

    try {
      // Upload sequentially so every successfully stored object is known and can be
      // compensated if a later upload, recipient lookup or database write fails.
      for (const file of files) {
        documents.push(await uploadPrivateDocument(file, id));
      }

      const referenceNumber = createReferenceNumber();
      const trackingToken = createTrackingToken();
      const email = parsed.data.email || null;

      const staffRecipients = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          roles: {
            some: {
              role: {
                permissions: {
                  some: { permission: { key: "assistance.view" } },
                },
              },
            },
          },
        },
        select: { id: true, email: true },
      });

      const applicantNotifications = email ? [{
        channel: NotificationChannel.EMAIL,
        recipient: email,
        templateKey: "assistance-request-received",
        subject: "We received your Amaana assistance request",
        payload: { referenceNumber },
      }] : [];

      const staffNotifications = staffRecipients.map(staff => ({
        channel: NotificationChannel.EMAIL,
        recipient: staff.email,
        templateKey: "assistance-staff-alert",
        subject: `New Amaana assistance request: ${referenceNumber}`,
        payload: {
          referenceNumber,
          city: parsed.data.city,
          category: parsed.data.category,
        },
        userId: staff.id,
      }));

      await prisma.assistanceRequest.create({
        data: {
          id,
          referenceNumber,
          applicantName: parsed.data.applicantName,
          phone: parsed.data.phone,
          email,
          city: parsed.data.city,
          category: parsed.data.category as AppealCategory,
          description: parsed.data.description,
          consentGivenAt: new Date(),
          trackingTokenHash: hashTrackingToken(trackingToken),
          documents: { create: documents },
          notifications: {
            create: [...applicantNotifications, ...staffNotifications],
          },
        },
      });

      return NextResponse.json(
        { referenceNumber, trackingToken },
        { status: 201, headers: privateHeaders },
      );
    } catch (submissionError) {
      const cleanupResults = await Promise.allSettled(
        documents.map(document => deletePrivateDocumentObject(document.objectKey, id)),
      );
      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("Assistance private-document cleanup failed", {
            documentIndex: index,
          });
        }
      });
      throw submissionError;
    }
  } catch {
    console.error("Assistance submission failed");
    return NextResponse.json(
      { error: "We could not securely submit your request. Please try again later." },
      { status: 500, headers: privateHeaders },
    );
  }
}
