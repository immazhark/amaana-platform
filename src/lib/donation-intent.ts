// Donor intent is distinct from the selected appeal designation and beneficiary eligibility review.
export const DONATION_INTENTS = ["GENERAL", "SADAQAH", "ZAKAT"] as const;

export type DonationIntentValue = typeof DONATION_INTENTS[number];

export const DONATION_INTENT_LABELS: Record<DonationIntentValue, string> = {
  GENERAL: "General Charity",
  SADAQAH: "Sadaqah",
  ZAKAT: "Zakat",
};

export const DONATION_INTENT_DESCRIPTIONS: Record<DonationIntentValue, string> = {
  GENERAL: "A general charitable contribution to this verified appeal.",
  SADAQAH: "Record this contribution as Sadaqah for this verified appeal.",
  ZAKAT: "Record this contribution as Zakat for an appeal Amaana has explicitly reviewed as Zakat-eligible.",
};

export function donationIntentLabel(value: string) {
  return value in DONATION_INTENT_LABELS
    ? DONATION_INTENT_LABELS[value as DonationIntentValue]
    : value.replaceAll("_", " ").toLowerCase();
}
