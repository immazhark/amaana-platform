/** Privacy-first contact preparation: no server submission, database write,
 * tracking request or public review publication happens on this page.
 * Only the user's explicit email application can transmit their message. */
export const FEEDBACK_KINDS = [
  { id: "concern", label: "Concern or complaint", guidance: "Raise a service, safety or conduct concern without publishing anyone's identity." },
  { id: "suggestion", label: "Suggestion or improvement", guidance: "Suggest a practical improvement to Amaana's work or website." },
  { id: "appreciation", label: "Private appreciation", guidance: "Share thanks privately. This never permits public testimonial use." },
] as const;

export const FEEDBACK_TOPICS = [
  { id: "general", label: "General work or service" },
  { id: "donations", label: "Donation or payment query" },
  { id: "privacy", label: "Privacy or public content" },
  { id: "conduct", label: "Volunteer or team conduct" },
  { id: "access", label: "Access to assistance" },
  { id: "website", label: "Website or accessibility" },
] as const;

export type FeedbackKind = typeof FEEDBACK_KINDS[number]["id"];
export type FeedbackTopic = typeof FEEDBACK_TOPICS[number]["id"];
export const MAX_FEEDBACK_NOTE_LENGTH = 480;
export const FEEDBACK_CONTACT_EMAIL = "amaanafoundation24@gmail.com";

export function sanitizeFeedbackNote(input: unknown): string {
  if (typeof input !== "string") return "";
  // Email body only. Never interpolate user text into the recipient or
  // subject; bound the URI and remove non-printing control characters.
  return [...input.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")]
    .slice(0, MAX_FEEDBACK_NOTE_LENGTH).join("").trim();
}

export function buildFeedbackEnquiryHref(kind: FeedbackKind, topic: FeedbackTopic, note = ""): string {
  const selectedKind = FEEDBACK_KINDS.find(item => item.id === kind) ?? FEEDBACK_KINDS[0];
  const selectedTopic = FEEDBACK_TOPICS.find(item => item.id === topic) ?? FEEDBACK_TOPICS[0];
  const safeNote = sanitizeFeedbackNote(note);
  const subject = `Amaana Foundation - ${selectedKind.label}`;
  const body = [
    "Assalamu alaikum Amaana team,",
    "",
    `Enquiry: ${selectedKind.label}`,
    `Area: ${selectedTopic.label}`,
    "",
    safeNote || "I would like to discuss this matter with a responsible team member.",
    "",
    "Please let me know an appropriate way to continue this conversation.",
    "I understand that sending an email does not create a tracked complaint ticket.",
    "This email is not consent to publish a review, testimonial, name or personal details.",
  ].join("\n");
  return `mailto:${FEEDBACK_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** A public GET page may carry only reviewed category IDs, never case
 * narratives, identity, contact details, or client-submitted free text. */
export function parseFeedbackPreferences(
  input: Record<string, string | string[] | undefined>,
): { kind: FeedbackKind; topic: FeedbackTopic } | null {
  if (Object.keys(input).some(key => !["intent", "kind", "topic"].includes(key)) || input.intent !== "review") return null;
  const { kind, topic } = input;
  if (typeof kind !== "string" || !FEEDBACK_KINDS.some(item => item.id === kind)
    || typeof topic !== "string" || !FEEDBACK_TOPICS.some(item => item.id === topic)) return null;
  return { kind: kind as FeedbackKind, topic: topic as FeedbackTopic };
}
