// Planning guidance for the seasonal giving campaigns of 2027. These are ESTIMATES, not announcements: Ramadan and
// both Eids depend on the local moon sighting, so confirm against the local calendar before opening a campaign.
// Nothing here opens, closes or schedules anything; campaigns are opened by an administrator.
export type SeasonalGuidance = { key: string; label: string; fundSlug: string; expected: string; basis: string };

export const SEASONAL_GUIDANCE_2027: readonly SeasonalGuidance[] = [
  { key: "dates", label: "Dates distribution", fundSlug: "dates", expected: "Late January to about 8 February 2027", basis: "Just before Ramadan begins" },
  { key: "eid-kits", label: "Eid kits", fundSlug: "eid-kits", expected: "About 18 to 22 February 2027", basis: "The 11th to 15th of Ramadan" },
  { key: "qurbani", label: "Qurbani meat distribution", fundSlug: "qurbani-meat", expected: "About 5 to 7 May 2027", basis: "10 to 12 days before Eid al-Adha" },
];

export const SEASONAL_GUIDANCE_NOTE =
  "Estimates only. Ramadan 1448 is expected around 8 to 9 February 2027, Eid al-Fitr around 10 to 11 March and Eid al-Adha around 17 May, all subject to the local moon sighting. Confirm the dates locally before opening a campaign. Prices are set each season, never in advance.";
