export type AmaanaInitiative = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  metric: string;
  metricLabel: string;
  years?: string;
  href: string;
};

export const initiatives: AmaanaInitiative[] = [
  {
    slug: "eid-gift-kits",
    title: "Eid Gift Kits",
    eyebrow: "Flagship initiative",
    summary: "A Ramadan tradition that began with 85 families in 2020 and grew to 710 Eid Gift Kits distributed in 2026.",
    metric: "710",
    metricLabel: "Eid Gift Kits in 2026",
    years: "2020–2026",
    href: "/our-work/eid-gift-kits",
  },
  {
    slug: "qurbani-meat-distribution",
    title: "Qurbani Meat Distribution",
    eyebrow: "Eid al-Adha",
    summary: "A small 2025 pilot grew into a larger 2026 distribution across Hyderabad, centred on dignity and careful preparation.",
    metric: "350+",
    metricLabel: "families reached in 2026",
    years: "2025–2026",
    href: "/our-work/qurbani-meat-distribution",
  },
  {
    slug: "taleem",
    title: "Amaana Taleem Initiative",
    eyebrow: "Education",
    summary: "Stationery and learning essentials prepared and distributed to children, including a documented activity reaching 50 orphan children.",
    metric: "50",
    metricLabel: "children in a documented Taleem activity",
    href: "/our-work/taleem",
  },
  {
    slug: "winter-relief",
    title: "Winter Drive",
    eyebrow: "Seasonal relief",
    summary: "Warm clothing, blankets and winter kits delivered through multi-phase community distribution.",
    metric: "234+",
    metricLabel: "campaign-reported beneficiaries",
    years: "2025–26",
    href: "/our-work/winter-relief",
  },
  {
    slug: "dates-distribution",
    title: "Dates Distribution",
    eyebrow: "Ramadan giving",
    summary: "A community-supported distribution of premium dates during Ramadan.",
    metric: "162 kg",
    metricLabel: "dates distributed",
    href: "/our-work/dates-distribution",
  },
  {
    slug: "medical-financial-assistance",
    title: "Medical & Financial Assistance",
    eyebrow: "Verified assistance",
    summary: "Case-led support for medical emergencies, livelihood needs and financial hardship after review of supporting information.",
    metric: "₹4.82L",
    metricLabel: "raised in one documented medical appeal",
    href: "/our-work/medical-financial-assistance",
  },
  {
    slug: "hyderabad-flood-relief-2020",
    title: "Hyderabad Flood Relief",
    eyebrow: "Emergency response",
    summary: "Relief work from Amaana's earliest grassroots period during the Hyderabad floods of 2020.",
    metric: "2020",
    metricLabel: "early community relief",
    href: "/our-work/hyderabad-flood-relief-2020",
  },
];

export const eidGrowth = [
  { year: "2020", families: 85 },
  { year: "2021", families: 171 },
  { year: "2022", families: 339 },
  { year: "2023", families: 408 },
  { year: "2024", families: 467 },
  { year: "2025", families: 650 },
  { year: "2026", families: 710 },
] as const;

export const homepageImpact = [
  { value: "710", label: "Eid Gift Kits distributed in 2026" },
  { value: "350+", label: "families reached through Qurbani Meat Distribution 2026" },
  { value: "234+", label: "campaign-reported Winter Drive beneficiaries" },
  { value: "162 kg", label: "dates distributed" },
] as const;

export const foundingStory = {
  eyebrow: "Where it began",
  headline: "It started with 85 families during Ramadan 2020.",
  body: "Before there was a formal Foundation, there was a family responding to hardship around them during COVID-19. What began as a small Ramadan effort grew year after year with the support of friends, families and the wider community.",
};
