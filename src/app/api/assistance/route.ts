import { AppealCategory, NotificationChannel } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assistanceSchema, createReferenceNumber, createTrackingToken, hashTrackingToken } from "@/lib/assistance";
import { prisma } from "@/lib/prisma";
import { deletePrivateDocumentObject, MAX_FILES, uploadPrivateDocument } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";
import { enforceAssistanceRateLimit, isSameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    validateProductionEnvironment();

    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    if (!(await enforceAssistanceRateLimit(request))) {
      return NextResponse.json(
        { error: "Too many assistance requests were submitted from this connection. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
      );
    }

    const formData = await request.formData();
    const parsed = assistanceSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the highlighted information and try again.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const files = formData.getAll("documents").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload up to ${MAX_FILES} documents.` }, { status: 400 });
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

      const applicantNotification = {
        channel: email ? NotificationChannel.EMAIL : NotificationChannel.SMS,
        recipient: email ?? parsed.data.phone,
        templateKey: "assistance-request-received",
        subject: email ? "We received your Amaana assistance request" : null,
        payload: { referenceNumber },
      };

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
            create: [applicantNotification, ...staffNotifications],
          },
        },
      });

      return NextResponse.json(
        { referenceNumber, trackingToken },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    } catch (submissionError) {
      const cleanupResults = await Promise.allSettled(
        documents.map(document => deletePrivateDocumentObject(document.objectKey, id)),
      );
      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("Assistance private-document cleanup failed", {
            objectKey: documents[index]?.objectKey,
            error: result.reason,
          });
        }
      });
      throw submissionError;
    }
  } catch (error) {
    console.error("Assistance submission failed", error);
    return NextResponse.json(
      { error: "We could not securely submit your request. Please try again later." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
