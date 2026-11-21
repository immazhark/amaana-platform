// The one source for the Taleem sponsorship head-count shown on public pages (brief v1.1, 22 November 2026).
//
// Every surface that states the number reads it from here, or is checked against it by src/content/taleem-facts.test.ts:
// the sponsor-education hero, the portfolio highlight, the homepage counter, and the Taleem programme copy and metric in
// master-copy.json and prisma/master-programmes.json. The database copy of the metric is overlaid from here at read time
// (src/lib/canonical-initiative-facts.ts) until prisma/canonical-factual-locks.json is applied to the live rows.
//
// This is the count of students currently reported as sponsored, an owner-confirmed aggregate. It is not a count of
// sponsored places maintained, of Hifdh completions, or of people supported since inception: those are separate metrics
// and are never added to it. No per-student record is implied.
export const TALEEM_FACTS = {
  sponsoredStudents: 26,
  asOf: { iso: "2026-11-22", label: "November 2026" },
  // Provenance, for the record and for review: not rendered publicly.
  provenance: "Owner-confirmed on 22 November 2026. The September 2026 count of 25 omitted one student: a correction, not growth.",
} as const;

/** The initiative slug whose database metric this fact overrides. */
export const TALEEM_INITIATIVE_SLUG = "taleem";

export const TALEEM_METRIC = {
  value: String(TALEEM_FACTS.sponsoredStudents),
  label: `Nazira / Hifdh students combined · ${TALEEM_FACTS.asOf.label}`,
} as const;

/** The sentence used in hero copy. Typographic apostrophe, matching the rest of that page. */
export const TALEEM_HERO_SENTENCE =
  `As of ${TALEEM_FACTS.asOf.label}, ${TALEEM_FACTS.sponsoredStudents} students across Qur’an Nazira and Hifdh are being sponsored through Amaana by multiple donors.`;
