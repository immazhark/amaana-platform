import { donationIntentLabel } from "@/lib/donation-intent";
type TemplatePayload = Record<string, unknown>;

export type RenderedEmail = { subject: string; text: string; html: string };

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function value(payload: TemplatePayload, key: string) {
  const item = payload[key];
  return typeof item === "string" ? item : "";
}

function wrap(message: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:620px"><p>Assalamu alaikum,</p>${message}<p>JazakAllah khair,<br>Amaana Foundation</p><p style="font-size:12px;color:#6b7280">Please do not reply with Aadhaar numbers, banking passwords, card details, UPI PINs or OTPs.</p></div>`;
}

export function renderNotificationEmail(templateKey: string, payload: TemplatePayload, configuredSubject?: string | null): RenderedEmail {
  const reference = value(payload, "referenceNumber");
  const safeReference = escapeHtml(reference);

  if (templateKey === "assistance-request-received") {
    const subject = configuredSubject || "We received your Amaana assistance request";
    return { subject, text: `Assalamu alaikum,\n\nWe received your assistance request. Reference: ${reference}. Keep your tracking details private.\n\nJazakAllah khair,\nAmaana Foundation`, html: wrap(`<p>We received your assistance request.</p><p><strong>Reference:</strong> ${safeReference}</p><p>Please keep your tracking details private. Our team will contact you if more information is required.</p>`) };
  }

  if (templateKey === "assistance-staff-alert") {
    const city = value(payload, "city");
    const category = value(payload, "category").replaceAll("_", " ").toLowerCase();
    const subject = configuredSubject || `New Amaana assistance request: ${reference}`;
    return {
      subject,
      text: `Assalamu alaikum,\n\nA new assistance request requires staff review. Reference: ${reference}. Category: ${category}. City: ${city}. Open the secure admin area to review the request and private documents. Do not forward sensitive information by email.\n\nJazakAllah khair,\nAmaana Foundation`,
      html: wrap(`<p>A new assistance request requires staff review.</p><p><strong>Reference:</strong> ${safeReference}<br><strong>Category:</strong> ${escapeHtml(category)}<br><strong>City:</strong> ${escapeHtml(city)}</p><p>Please use the secure admin area to review the request and any private documents. Do not forward sensitive information by email.</p>`),
    };
  }

  if (templateKey === "assistance-status-updated") {
    const status = value(payload, "status").replaceAll("_", " ").toLowerCase();
    const subject = configuredSubject || "Your Amaana request status was updated";
    return { subject, text: `Assalamu alaikum,\n\nThe status of assistance request ${reference} is now: ${status}.\n\nJazakAllah khair,\nAmaana Foundation`, html: wrap(`<p>The status of assistance request <strong>${safeReference}</strong> is now <strong>${escapeHtml(status)}</strong>.</p>`) };
  }

  if (templateKey === "donation-acknowledgement") {
    const intent = value(payload, "givingIntent");
    const intentLabel = intent ? donationIntentLabel(intent) : "";
    const intentText = intentLabel ? ` Giving intention: ${intentLabel}.` : "";
    const intentHtml = intentLabel ? `<p><strong>Giving intention:</strong> ${escapeHtml(intentLabel)}</p>` : "";
    const subject = configuredSubject || "Thank you for supporting an Amaana Foundation appeal";
    return { subject, text: `Assalamu alaikum,\n\nThank you for your donation. Reference: ${reference}.${intentText} This is a normal donation acknowledgement and not an 80G tax certificate.\n\nJazakAllah khair,\nAmaana Foundation`, html: wrap(`<p>Thank you for supporting an Amaana Foundation appeal.</p><p><strong>Donation reference:</strong> ${safeReference}</p>${intentHtml}<p>This is a normal donation acknowledgement and is not an 80G tax certificate.</p>`) };
  }

  if (templateKey === "operational-email-acceptance") {
    const subject = configuredSubject || "Amaana Foundation transactional email acceptance";
    return {
      subject,
      text: "Assalamu alaikum,\n\nThis is Amaana Foundation's controlled transactional-email acceptance message. It contains no donor, beneficiary, payment or assistance-case data. If you received this message once, the production delivery path reached the authorised staff recipient successfully.\n\nJazakAllah khair,\nAmaana Foundation",
      html: wrap("<p>This is Amaana Foundation's controlled transactional-email acceptance message.</p><p>It contains no donor, beneficiary, payment or assistance-case data.</p><p>If you received this message once, the production delivery path reached the authorised staff recipient successfully.</p>"),
    };
  }

  if (templateKey === "donation-refund-processed") {
    const refundAmount = value(payload, "refundAmount");
    const refundState = value(payload, "refundState") || "refund";
    const subject = configuredSubject || "Amaana Foundation donation refund processed";
    return {
      subject,
      text: `Assalamu alaikum,\n\nA ${refundState} of ${refundAmount} has been processed for donation reference ${reference}. Please allow your bank/payment provider's normal settlement time for the credit to appear.\n\nJazakAllah khair,\nAmaana Foundation`,
      html: wrap(`<p>A <strong>${escapeHtml(refundState)}</strong> of <strong>${escapeHtml(refundAmount)}</strong> has been processed for donation reference <strong>${safeReference}</strong>.</p><p>Please allow your bank or payment provider's normal settlement time for the credit to appear.</p>`),
    };
  }

  throw new Error(`Unsupported notification template: ${templateKey}`);
}
