// Individual-assistance eligibility and intake policy. One place for the rules and wording, so the public page, the form, the
// API and the contact page cannot drift apart. Pure: no database, no clock.
//
// OWNER DECISION OPEN: the exact Hyderabad boundary (Hyderabad district, GHMC, or the wider metropolitan area) has no approved
// definition in the repository. The policy therefore asks the structured question "does the beneficiary live in our Hyderabad
// service area?", shows the owner's wording, and leaves the locality to human review. It does not map locality text or postcodes
// to eligibility, and it does not use IP, phone country code or nationality.

export const ASSISTANCE_RESIDENCE_VALUES = ["HYDERABAD_SERVICE_AREA", "OUTSIDE_SERVICE_AREA"] as const;
export type AssistanceResidence = (typeof ASSISTANCE_RESIDENCE_VALUES)[number];

/** Owner-stated planning ceiling for individual cases taken up per calendar year. A maximum, not a commitment or entitlement.
 * Annual distributions, Taleem sponsorships and other established programmes do not count against it. */
export const INDIVIDUAL_CASE_ANNUAL_CAPACITY = 12;

/** Environment switch for pausing intake without a deploy-time schema change. "true" pauses; anything else leaves intake open. */
export const isAssistanceIntakePaused = (env: Readonly<Record<string, string | undefined>> = process.env) =>
  env.ASSISTANCE_INTAKE_PAUSED?.trim().toLowerCase() === "true";

export const OUTSIDE_SERVICE_AREA_MESSAGE =
  "Thank you for reaching out. Amaana Foundation currently considers individual assistance only for beneficiaries who live in our Hyderabad service area, so we cannot assess or support this request. This is a limit of our small volunteer capacity, not a judgement of your need. If you are applying for someone who lives in Hyderabad, change the answer above. Please do not delay urgent care while looking for support.";

export const INTAKE_PAUSED_MESSAGE =
  "We are not taking up new assistance requests at present. This does not reflect on any individual need, and we cannot say when intake will reopen. Please do not delay urgent care while waiting.";

export const ASSISTANCE_SCOPE_NOTICE = [
  "Amaana Foundation currently considers individual assistance requests only for beneficiaries residing within our Hyderabad service area. We are a small volunteer-led organisation with limited resources, and we can assess only a small number of cases involving severe, verifiable hardship.",
  "We raise funds for selected verified cases and planned initiatives. We do not operate a general cash-assistance fund. Submitting a request does not guarantee assessment, fundraising or financial support.",
  "Please use the assistance form. We do not accept new assistance applications through phone calls or WhatsApp. If further information is needed, our team will contact you.",
] as const;

export const ASSISTANCE_SCOPE_POINTS = [
  "Support depends on verification, our capacity and available funding.",
  "We are not an emergency response service. Please do not delay urgent care while waiting for a response.",
  "Repeat messages or repeat submissions do not improve priority.",
] as const;

/** Outcome codes for declining a request. The label is what the reviewer sees and what is recorded with the decision. */
export const ASSISTANCE_DECLINE_REASONS = [
  { code: "OUTSIDE_SERVICE_AREA", label: "Outside service area", needsNote: false },
  { code: "OUTSIDE_SCOPE", label: "Outside current assistance scope", needsNote: false },
  { code: "INSUFFICIENT_INFORMATION", label: "Insufficient information", needsNote: false },
  { code: "UNABLE_TO_VERIFY", label: "Unable to verify", needsNote: false },
  { code: "DUPLICATE", label: "Duplicate request", needsNote: false },
  { code: "CAPACITY_UNAVAILABLE", label: "Capacity unavailable", needsNote: false },
  { code: "WITHDRAWN", label: "Withdrawn", needsNote: false },
  { code: "OTHER", label: "Other reason (note required)", needsNote: true },
] as const;
export type AssistanceDeclineReasonCode = (typeof ASSISTANCE_DECLINE_REASONS)[number]["code"];

/** Combines a chosen reason code and an optional note into the recorded reason text. No code leaves the typed note unchanged. */
export function composeDeclineReason(code: string, note: string): string {
  const trimmed = note.trim();
  const found = ASSISTANCE_DECLINE_REASONS.find(reason => reason.code === code);
  if (!found) return trimmed;
  const label = found.code === "OTHER" ? "Other" : found.label;
  return trimmed ? `${label}: ${trimmed}` : found.needsNote ? "" : label;
}
