// Amaana Taleem student sponsorship catalogue. The owner approved these baseline rates on 21 November 2026
// (Qaida Rs 1,000, Nazira Rs 1,200, Hifdh Day Scholar Rs 1,500 per unit per month). Approval only makes a quote
// valid: the public flow stays closed until TALEEM_SPONSORSHIP_ENABLED and FUND_GIVING_ENABLED are both on. A later
// rate change must bump `version`; a stored donation keeps the rate and version it was quoted. Amounts are integer
// paise. These are programme-level sponsorship contributions, not a statement of Madarsa fee obligations.
export type TaleemProgrammeId = "qaida" | "nazira" | "hifdh-day-scholar";
export type RateApproval = "BASELINE_PENDING_APPROVAL" | "APPROVED";

export type TaleemProgramme = {
  id: TaleemProgrammeId;
  name: string;
  summary: string;
  monthlyPaise: number;
  available: boolean;
  approval: RateApproval;
};

export type TaleemCatalogue = { version: string; programmes: TaleemProgramme[] };

export const TALEEM_CATALOGUE: TaleemCatalogue = {
  version: "approved-2026-11",
  programmes: [
    { id: "qaida", name: "Qaida", summary: "Foundational Qur'an reading education and early learning.", monthlyPaise: 100_000, available: true, approval: "APPROVED" },
    { id: "nazira", name: "Qur'an Nazira", summary: "Learning to read the Qur'an with proper instruction and guided practice.", monthlyPaise: 120_000, available: true, approval: "APPROVED" },
    { id: "hifdh-day-scholar", name: "Hifdh — Day Scholar", summary: "Structured Qur'an memorisation for day scholars.", monthlyPaise: 150_000, available: true, approval: "APPROVED" },
  ],
};
