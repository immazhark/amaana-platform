/** Hero actions for the fund-giving pages. The generic article default
 * ("Explore Our Work" / "Contact Amaana") gave neither page a way to give. */
export const FUND_CHOICE_ANCHOR = "#choose-fund";

export type GivingHeroAction = { label: string; href: string; secondary?: boolean };

export const GIVE_HERO_ACTIONS: readonly GivingHeroAction[] = [
  { label: "Choose a fund", href: FUND_CHOICE_ANCHOR },
  { label: "See how each fund is used", href: "/funds", secondary: true },
];

export const FUNDS_HERO_ACTIONS: readonly GivingHeroAction[] = [
  { label: "Give to a fund", href: "/give" },
  { label: "How we verify", href: "/how-we-verify", secondary: true },
];
