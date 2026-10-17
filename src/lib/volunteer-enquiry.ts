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
