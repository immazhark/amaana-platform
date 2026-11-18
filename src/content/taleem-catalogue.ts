// Amaana Taleem student sponsorship catalogue. Rates are the historical planning baseline and are
// NOT approved for live payment: `approval` must be changed to "APPROVED" by the owner, with the new
// `version`, before checkout may be enabled. Amounts are integer paise. These are sponsorship
// contributions, not a statement of Madarsa fee obligations.
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
  version: "baseline-2026-11",
  programmes: [
    { id: "qaida", name: "Qaida", summary: "Foundational Qur'an reading education and early learning.", monthlyPaise: 100_000, available: true, approval: "BASELINE_PENDING_APPROVAL" },
    { id: "nazira", name: "Qur'an Nazira", summary: "Learning to read the Qur'an with proper instruction and guided practice.", monthlyPaise: 120_000, available: true, approval: "BASELINE_PENDING_APPROVAL" },
    { id: "hifdh-day-scholar", name: "Hifdh — Day Scholar", summary: "Structured Qur'an memorisation for day scholars.", monthlyPaise: 150_000, available: true, approval: "BASELINE_PENDING_APPROVAL" },
  ],
};
