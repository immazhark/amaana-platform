/** Privacy-preserving pre-contact preparation. No server submission or
 * volunteer/beneficiary data store is created by this feature. */
export const VOLUNTEER_SKILLS = [
  "Distribution and packing",
  "Photography and documentation",
  "Design and communication",
  "Technology and website support",
  "Event logistics",
  "Other practical help",
] as const;

export const VOLUNTEER_AVAILABILITY = [
  "Occasionally",
  "Weekends",
  "Remote when suitable",
  "For a specific initiative",
] as const;

export type VolunteerSkill = typeof VOLUNTEER_SKILLS[number];
export type VolunteerAvailability = typeof VOLUNTEER_AVAILABILITY[number];

export function buildVolunteerEnquiryHref(
  skills: readonly VolunteerSkill[],
  availability: VolunteerAvailability | "",
): string {
  // All message fields come from fixed labels, never untrusted visitor text.
  const reviewedSkills = VOLUNTEER_SKILLS.filter(skill => skills.includes(skill));
  const reviewedAvailability = VOLUNTEER_AVAILABILITY.includes(
    availability as VolunteerAvailability,
  ) ? availability : "Not specified";
  const subject = "Amaana Foundation - Volunteer interest";
  const body = [
    "Assalamu alaikum Amaana team,",
    "",
    "I would like to discuss offering my time or skills where useful.",
    `Areas of interest: ${reviewedSkills.length ? reviewedSkills.join(", ") : "Open to discussing available needs"}`,
    `Availability: ${reviewedAvailability}`,
    "",
    "Please let me know if there is an appropriate current need and what safeguarding expectations apply.",
    "",
    "I understand this is an enquiry, not a confirmed placement, and will not share beneficiary records or sensitive documents by email.",
  ].join("\n");
  return `mailto:amaanafoundation24@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Fixed public choices only. Query strings must never accept names, contact
 * details, free text or duplicate values from an untrusted browser URL. */
export function parseVolunteerPreferences(
  input: Record<string, string | string[] | undefined>,
): { skills: VolunteerSkill[]; availability: VolunteerAvailability | "" } | null {
  const keys = Object.keys(input);
  if (keys.some(key => !["intent", "skill", "availability"].includes(key)) || input.intent !== "review") return null;
  const rawSkills = input.skill === undefined ? [] : Array.isArray(input.skill) ? input.skill : [input.skill];
  if (rawSkills.length > VOLUNTEER_SKILLS.length || new Set(rawSkills).size !== rawSkills.length
    || rawSkills.some(skill => !VOLUNTEER_SKILLS.some(allowed => allowed === skill))) return null;
  const availability = input.availability ?? "";
  if (typeof availability !== "string"
    || (availability !== "" && !VOLUNTEER_AVAILABILITY.some(allowed => allowed === availability))) return null;
  return {
    skills: VOLUNTEER_SKILLS.filter(skill => rawSkills.includes(skill)),
    availability: availability as VolunteerAvailability | "",
  };
}
