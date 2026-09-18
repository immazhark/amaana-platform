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
    href: "/our-work#eid-gift-kits",
  },
  {
    slug: "qurbani-meat-distribution",
    title: "Qurbani Meat Distribution",
    eyebrow: "Eid al-Adha",
    summary: "A small 2025 pilot grew into a larger 2026 distribution across Hyderabad, centred on dignity and careful preparation.",
    metric: "350+",
    metricLabel: "families reached in 2026",
    years: "2025–2026",
    href: "/our-work#qurbani-meat-distribution",
  },
  {
    slug: "taleem",
    title: "Amaana Taleem Initiative",
    eyebrow: "Education",
    summary: "Stationery and learning essentials prepared and distributed to children, including a documented activity reaching 50 orphan children.",
    metric: "50",
    metricLabel: "children in a documented Taleem activity",
    href: "/our-work#taleem",
  },
  {
    slug: "winter-relief",
    title: "Winter Drive",
    eyebrow: "Seasonal relief",
    summary: "During the 2025–26 winter season, Amaana Foundation distributed 234 Winter Kits to 234 beneficiaries through a multi-phase community distribution.",
    metric: "234",
    metricLabel: "Winter Kits distributed to 234 beneficiaries",
    years: "2025–26",
    href: "/our-work#winter-relief",
  },
  {
    slug: "dates-distribution",
    title: "Dates Distribution",
    eyebrow: "Ramadan giving",
    summary: "A community-supported distribution of premium dates during Ramadan.",
    metric: "162 kg",
    metricLabel: "dates distributed",
    href: "/our-work#dates-distribution",
  },
  {
    slug: "medical-financial-assistance",
    title: "Medical & Financial Assistance",
    eyebrow: "Verified assistance",
    summary: "Case-led support for medical emergencies, livelihood needs and financial hardship after review of supporting information.",
    metric: "₹482,700",
    metricLabel: "raised in one documented medical appeal",
    href: "/our-work#medical-financial-assistance",
  },
  {
    slug: "hyderabad-flood-relief-2020",
    title: "Hyderabad Flood Relief",
    eyebrow: "Emergency response",
    summary: "Relief work from Amaana's earliest grassroots period during the Hyderabad floods of 2020.",
    metric: "2020",
    metricLabel: "early community relief",
    href: "/our-work#hyderabad-flood-relief-2020",
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
  { value: "2,830", label: "family distributions · seven Eid Gift Kit drives, 2020–2026" },
  { value: "500+", label: "family distributions · Qurbani drives, 2025–2026" },
  { value: "420 kg", label: "dates distributed · Ramadan drives, 2023–2026" },
  { value: "25", label: "Nazira / Hifdh students combined · September 2026" },
] as const;

export const foundingStory = {
  eyebrow: "Where it began",
  headline: "It started with 85 families during Ramadan 2020.",
  body: "Before there was a formal Foundation, there was a family responding to hardship around them during COVID-19. What began as a small Ramadan effort grew year after year with the support of friends, families and the wider community.",
};