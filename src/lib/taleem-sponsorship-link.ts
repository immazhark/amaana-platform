import type { TaleemProgrammeId } from "@/content/taleem-catalogue";

// Deep links from a Taleem programme page to the sponsorship form on the sponsor page, with that programme already
// chosen. The programme is only ever a hint: the sponsor page validates it against the live offer, and the server still
// prices the gift from the catalogue, so a hand-edited link can preselect nothing and change no amount.

export const SPONSOR_PAGE_PATH = "/get-involved/sponsor-education";

const PROGRAMME_FOR_SLUG: Readonly<Record<string, TaleemProgrammeId>> = {
  "taleem-nazira-sponsorship": "nazira",
  "taleem-hifdh-sponsorship": "hifdh-day-scholar",
};

/** The link a Taleem page uses to start sponsoring. Programme pages preselect their own programme; the overview, which
 * has three, goes to the form without choosing for the donor. */
export function sponsorshipHrefForSlug(slug: string): string {
  const programme = PROGRAMME_FOR_SLUG[slug];
  return programme ? `${SPONSOR_PAGE_PATH}?programme=${programme}#programme-sponsorship` : `${SPONSOR_PAGE_PATH}#programme-sponsorship`;
}

/** The programme named by the `programme` query value, only if the current offer actually contains it. */
export function requestedProgramme(
  value: string | string[] | undefined,
  offered: readonly { id: TaleemProgrammeId }[],
): TaleemProgrammeId | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return offered.find(item => item.id === first)?.id;
}
