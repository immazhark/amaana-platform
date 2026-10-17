import { AppealCategory, NotificationChannel } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assistanceSchema, createReferenceNumber, createTrackingToken, hashTrackingToken } from "@/lib/assistance";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readBodyBytesWithLimit } from "@/lib/bounded-request-body";
import { prisma } from "@/lib/prisma";
import { deletePrivateDocumentObject, MAX_FILE_BYTES, MAX_FILES, uploadPrivateDocument } from "@/lib/storage";
import { validateProductionEnvironment } from "@/lib/env";
import { enforceAssistanceRateLimit, isSameOrigin } from "@/lib/request-security";
import { logServerError } from "@/lib/server-log";

export const runtime = "nodejs";
const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const ASSISTANCE_MULTIPART_OVERHEAD_BYTES = 512 * 1024;
const MAX_ASSISTANCE_MULTIPART_BYTES = MAX_FILES * MAX_FILE_BYTES + ASSISTANCE_MULTIPART_OVERHEAD_BYTES;
const ASSISTANCE_UPLOAD_TIMEOUT_MS = 120_000;

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

    let bodyBytes: Uint8Array;
    try {
      // An absolute deadline prevents stalled or trickling multipart requests
      // from tying up the assistance submission handler indefinitely.
      bodyBytes = await readBodyBytesWithLimit(request, MAX_ASSISTANCE_MULTIPART_BYTES, {
        timeoutMs: ASSISTANCE_UPLOAD_TIMEOUT_MS,
      });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json(
          { error: "The assistance submission is too large. Upload no more than five documents of up to 5 MB each." },
          { status: 413, headers: privateHeaders },
        );
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        return NextResponse.json(
          { error: "The assistance upload timed out. Please try again." },
          { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
        );
      }
      // Network interruption is transport failure, not invalid application data.
      // Parsing, file storage, and case creation have not begun.
      return NextResponse.json(
        { error: "The assistance upload could not be read. Please try again." },
        { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } },
      );
    }

    let formData: FormData;
    try {
      formData = await new Response(bodyBytes, { headers: { "Content-Type": contentType } }).formData();
    } catch {
      return NextResponse.json({ error: "Invalid assistance submission format." }, { status: 400, headers: privateHeaders });
    }

    // Each applicant detail and the explicit consent decision must be
    // unambiguous. FormData -> object conversion otherwise silently keeps the
    // final repeated value, which may override a different identity or consent.
    // Documents are intentionally excluded because multiple files are allowed.
    const singleValueFields = ["applicantName", "phone", "email", "city", "category", "description", "consent"] as const;
    for (const field of singleValueFields) {
      const values = formData.getAll(field);
      if (values.length > 1 || values.some(value => typeof value !== "string")) {
        return NextResponse.json(
          { error: "Each application field must be provided as a single text value." },
          { status: 400, headers: privateHeaders },
        );
      }
    }

    const parsed = assistanceSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the highlighted information and try again.", fields: parsed.error.flatten().fieldErrors },
        { status: 400, headers: privateHeaders },
      );
    }

    const files: File[] = [];
    for (const entry of formData.getAll("documents")) {
      if (typeof entry === "string") {
        // Allow the browser's empty optional file placeholder, not a forged
        // textual document field that would silently lose applicant evidence.
        if (entry === "") continue;
        return NextResponse.json({ error: "Each supporting document must be a file." }, { status: 400, headers: privateHeaders });
      }
      if (entry.size === 0) {
        // An untouched optional file input can produce an empty unnamed File.
        if (!entry.name) continue;
        return NextResponse.json({ error: "A supporting document is empty. Please choose a valid file." }, { status: 400, headers: privateHeaders });
      }
      files.push(entry);
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `You can upload up to ${MAX_FILES} documents.` }, { status: 400, headers: privateHeaders });
    }

    const id = randomUUID();
    const documents: Awaited<ReturnType<typeof uploadPrivateDocument>>[] = [];
    const referenceNumber = createReferenceNumber();
    const trackingToken = createTrackingToken();
    let persistenceAttempted = false;

    try {
      // Upload sequentially so every successfully stored object is known and can be
      // compensated if a later upload, recipient lookup or database write fails.
      for (const file of files) {
        documents.push(await uploadPrivateDocument(file, id));
      }

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

      persistenceAttempted = true;
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
      if (persistenceAttempted) {
        // A write can commit even if the network connection drops before its
        // acknowledgement. An existing case must retain its private evidence.
        try {
          const persisted = await prisma.assistanceRequest.findUnique({
            where: { id },
            select: { id: true },
          });
          if (persisted) {
            return NextResponse.json(
              { referenceNumber, trackingToken },
              { status: 201, headers: privateHeaders },
            );
          }
        } catch {
          // An unavailable database cannot prove the write failed. Retain the
          // documents for reconciliation instead of risking irreversible loss.
          logServerError("assistance.persistence_outcome_unknown");
          throw submissionError;
        }
      }

      const cleanupResults = await Promise.allSettled(
        documents.map(document => deletePrivateDocumentObject(document.objectKey, id)),
      );
      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          logServerError("assistance.private_document_cleanup_failed", { documentIndex: index });
        }
      });
      throw submissionError;
    }
  } catch {
    logServerError("assistance.submission_failed");
    return NextResponse.json(
      { error: "We could not securely submit your request. Please try again later." },
      { status: 500, headers: privateHeaders },
    );
  }
}
