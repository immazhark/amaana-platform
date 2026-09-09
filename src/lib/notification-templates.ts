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

  if (templateKey === "assistance-status-updated") {
    const status = value(payload, "status").replaceAll("_", " ").toLowerCase();
    const subject = configuredSubject || "Your Amaana request status was updated";
    return { subject, text: `Assalamu alaikum,\n\nThe status of assistance request ${reference} is now: ${status}.\n\nJazakAllah khair,\nAmaana Foundation`, html: wrap(`<p>The status of assistance request <strong>${safeReference}</strong> is now <strong>${escapeHtml(status)}</strong>.</p>`) };
  }

  if (templateKey === "donation-acknowledgement") {
    const subject = configuredSubject || "Thank you for supporting an Amaana Foundation appeal";
    return { subject, text: `Assalamu alaikum,\n\nThank you for your donation. Reference: ${reference}. This is a normal donation acknowledgement and not an 80G tax certificate.\n\nJazakAllah khair,\nAmaana Foundation`, html: wrap(`<p>Thank you for supporting an Amaana Foundation appeal.</p><p><strong>Donation reference:</strong> ${safeReference}</p><p>This is a normal donation acknowledgement and is not an 80G tax certificate.</p>`) };
  }

  throw new Error(`Unsupported notification template: ${templateKey}`);
}
