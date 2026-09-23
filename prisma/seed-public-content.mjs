import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const causes = [
  {
    slug: "seasonal-food-support",
    title: "Seasonal & Food Support",
    summary: "Seasonal giving and food support shaped around Ramadan, Eid and community need.",
    description: "Amaana's documented seasonal work includes Eid Gift Kits, Qurbani meat distribution, dates distribution and winter relief.",
    displayOrder: 1,
  },
  {
    slug: "education",
    title: "Education",
    summary: "Practical learning support for children through documented education initiatives.",
    description: "Amaana's Taleem work includes stationery and learning essentials distributed through verified community activities.",
    displayOrder: 2,
  },
  {
    slug: "medical-financial-assistance",
    title: "Medical & Financial Assistance",
    summary: "Case-led assistance for documented medical, livelihood and financial hardship needs.",
    description: "Requests are reviewed with supporting information before assistance or a public appeal is considered.",
    displayOrder: 3,
  },
  {
    slug: "emergency-relief",
    title: "Emergency Relief",
    summary: "Community response during urgent local hardship and emergency situations.",
    description: "Amaana's early grassroots work includes relief activity during the Hyderabad floods of 2020.",
    displayOrder: 4,
  },
];

const initiatives = [
  {
    slug: "eid-gift-kits",
    title: "Eid Gift Kits",
    summary: "A Ramadan tradition that began with 85 families in 2020 and grew to 710 Eid Gift Kits distributed in 2026.",
    story: "A recurring Ramadan initiative focused on helping families prepare for Eid with care and dignity.",
    startYear: 2020,
    endYear: 2026,
    primaryMetric: "710",
    primaryMetricLabel: "Eid Gift Kits distributed in 2026",
    financialSummary: {
      history: [
        { year: 2020, families: 85, donations: "₹68,000.00", kitCost: "₹797" },
        { year: 2021, families: 171, donations: "₹226,008.74", kitCost: "₹1,327", detailedExpenditure: "₹230,027", notes: "Kit cost ₹226,917 plus ₹3,110 packaging and transport." },
        { year: 2022, families: 339, donations: "₹484,770.00", kitCost: "₹1,430", detailedExpenditure: "₹506,130", notes: "Includes 12 customised kits at ₹15,360 plus ₹6,000 packaging and transport." },
        { year: 2023, families: 408, donations: "₹610,153.28", kitCost: "₹1,500", detailedExpenditure: "₹616,000", notes: "Actual reported kit cost was ₹1,519; campaign rounded/discounted the public kit figure to ₹1,500." },
        { year: 2024, families: 467, donations: "₹700,500.00", kitCost: "₹1,500", detailedExpenditure: "₹710,500", notes: "Includes ₹10,000 packaging and transport." },
        { year: 2025, families: 650, donations: "₹1,110,742.53", kitCost: "₹1,709", detailedExpenditure: "₹1,125,742.53", notes: "₹15,000 packaging and transport was documented as not taken from donations." },
        { year: 2026, families: 710 },
      ],
      breakdown2026: [
        { label: "Women-led households of hardship", count: 201, share: "28.3%" },
        { label: "Children & vulnerable students", count: 134, share: "18.9%" },
        { label: "Masjid-linked", count: 86, share: "12.1%" },
        { label: "Other financially vulnerable", count: 118, share: "16.6%" },
        { label: "Daily wage labour & skilled", count: 65, share: "9.2%" },
        { label: "Widows (primary need)", count: 55, share: "7.7%" },
        { label: "Drivers & transport", count: 33, share: "4.6%" },
        { label: "Medical hardship & disability", count: 18, share: "2.5%" },
      ],
      sourceStatus: "Approved website figures from reviewed Amaana source material. Newly uploaded historical-stat archive remains pending file-level reconciliation and must not silently override approved values.",
    },
    isFeatured: true,
    displayOrder: 1,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2020",
    title: "2020 — Where the Eid Gift Kits Journey Began",
    summary: "In Ramadan 2020, during the uncertainty of the COVID period, the family-led effort that would later become Amaana Foundation began its Eid support programme by preparing and distributing gift kits to 85 families in Hyderabad. Each kit was valued at approximately ₹797 and contained practical household and festive essentials intended to help families prepare for Eid with dignity. This first drive became the foundation for what would grow into Amaana’s flagship annual initiative.",
    story: "In Ramadan 2020, during the uncertainty of the COVID period, the family-led effort that would later become Amaana Foundation began its Eid support programme by preparing and distributing gift kits to 85 families in Hyderabad. Each kit was valued at approximately ₹797 and contained practical household and festive essentials intended to help families prepare for Eid with dignity. This first drive became the foundation for what would grow into Amaana’s flagship annual initiative.",
    year: 2020,
    primaryMetric: "85",
    primaryMetricLabel: "families reached in 2020",
    displayOrder: 11,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2021",
    title: "2021 — Growing Beyond the First Year",
    summary: "The Eid Gift Kits initiative continued in 2021 and more than doubled its first-year reach. 171 families received Eid support, with each kit valued at approximately ₹1,327. The growth reflected increasing community participation and strengthened the team’s commitment to making the programme an annual effort rather than a one-time response.",
    story: "The Eid Gift Kits initiative continued in 2021 and more than doubled its first-year reach. 171 families received Eid support, with each kit valued at approximately ₹1,327. The growth reflected increasing community participation and strengthened the team’s commitment to making the programme an annual effort rather than a one-time response.",
    year: 2021,
    primaryMetric: "171",
    primaryMetricLabel: "families reached in 2021",
    displayOrder: 12,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2022",
    title: "2022 — Expanding Reach and Responding to Individual Needs",
    summary: "In 2022, the programme expanded significantly to support 339 families, with the standard kit valued at approximately ₹1,430. Records from the year also note 12 customised kits, reflecting an effort to respond to particular household needs rather than treating every family identically. The drive marked another major step in the programme’s scale and organisation.",
    story: "In 2022, the programme expanded significantly to support 339 families, with the standard kit valued at approximately ₹1,430. Records from the year also note 12 customised kits, reflecting an effort to respond to particular household needs rather than treating every family identically. The drive marked another major step in the programme’s scale and organisation.",
    year: 2022,
    primaryMetric: "339",
    primaryMetricLabel: "families reached in 2022",
    displayOrder: 13,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2023",
    title: "2023 — More Than 400 Families Supported",
    summary: "Amaana’s Eid Gift Kits drive reached 408 families in 2023. The actual kit cost was recorded at approximately ₹1,519, while the programme worked with a rounded/discounted figure of about ₹1,500 per kit. By this stage, the initiative had grown from a small family-led effort into a recurring community programme supporting hundreds of households each Ramadan.",
    story: "Amaana’s Eid Gift Kits drive reached 408 families in 2023. The actual kit cost was recorded at approximately ₹1,519, while the programme worked with a rounded/discounted figure of about ₹1,500 per kit. By this stage, the initiative had grown from a small family-led effort into a recurring community programme supporting hundreds of households each Ramadan.",
    year: 2023,
    primaryMetric: "408",
    primaryMetricLabel: "families reached in 2023",
    displayOrder: 14,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2024",
    title: "2024 — Sustaining a Growing Annual Commitment",
    summary: "In 2024, Amaana Foundation provided Eid Gift Kits to 467 families, with each kit valued at approximately ₹1,500. The drive continued the initiative’s steady year-on-year growth while preserving its original purpose: helping financially vulnerable households prepare for Eid with useful, dignified support.",
    story: "In 2024, Amaana Foundation provided Eid Gift Kits to 467 families, with each kit valued at approximately ₹1,500. The drive continued the initiative’s steady year-on-year growth while preserving its original purpose: helping financially vulnerable households prepare for Eid with useful, dignified support.",
    year: 2024,
    primaryMetric: "467",
    primaryMetricLabel: "families reached in 2024",
    displayOrder: 15,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2025",
    title: "2025 — Reaching 650 Families",
    summary: "The 2025 Eid Gift Kits drive marked another major expansion, reaching 650 families. Each kit was valued at approximately ₹1,709, with the programme continuing to combine staple and festive household essentials for Eid. Separate records also show that approximately ₹15,000 in packaging and transport costs was covered outside the main donations, helping preserve donor contributions for the intended kit distribution.",
    story: "The 2025 Eid Gift Kits drive marked another major expansion, reaching 650 families. Each kit was valued at approximately ₹1,709, with the programme continuing to combine staple and festive household essentials for Eid. Separate records also show that approximately ₹15,000 in packaging and transport costs was covered outside the main donations, helping preserve donor contributions for the intended kit distribution.",
    year: 2025,
    primaryMetric: "650",
    primaryMetricLabel: "families reached in 2025",
    displayOrder: 16,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "eid-gift-kits-2026",
    title: "2026 — The Largest Eid Gift Kits Drive Yet",
    summary: "In 2026, Amaana Foundation’s Eid Gift Kits initiative reached its largest documented scale to date, supporting 710 families. Each kit was valued at approximately ₹1,783 and was designed to help households prepare for Eid with a meaningful combination of staple and festive essentials. The year reflected the programme’s growth from 85 families in 2020 to 710 families in 2026, while retaining the same principle at its core: support should preserve dignity and respond to genuine household need.",
    story: "In 2026, Amaana Foundation’s Eid Gift Kits initiative reached its largest documented scale to date, supporting 710 families. Each kit was valued at approximately ₹1,783 and was designed to help households prepare for Eid with a meaningful combination of staple and festive essentials. The year reflected the programme’s growth from 85 families in 2020 to 710 families in 2026, while retaining the same principle at its core: support should preserve dignity and respond to genuine household need.",
    year: 2026,
    primaryMetric: "710",
    primaryMetricLabel: "families reached in 2026",
    displayOrder: 17,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "qurbani-meat-distribution",
    title: "Qurbani Meat Distribution",
    summary: "A 2025 pilot grew into a larger 2026 distribution across Hyderabad, centred on dignity and careful preparation.",
    story: "Amaana began with a small 2025 pilot and expanded the documented 2026 distribution to reach more families.",
    startYear: 2025,
    endYear: 2026,
    primaryMetric: "350+",
    primaryMetricLabel: "families reached in 2026",
    isFeatured: true,
    displayOrder: 2,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "taleem",
    title: "Amaana Taleem Initiative",
    summary: "Stationery and learning essentials prepared and distributed to children, including a documented activity reaching 50 orphan children.",
    story: "An education initiative focused on practical learning essentials delivered through documented community activity.",
    primaryMetric: "50",
    primaryMetricLabel: "children in a documented Taleem activity",
    displayOrder: 3,
    causeSlug: "education",
  },
  {
    slug: "winter-relief",
    title: "Winter Drive",
    summary: "Warm clothing, blankets and winter kits delivered through multi-phase community distribution.",
    story: "A seasonal relief initiative delivered in documented phases through community institutions and local distribution.",
    startYear: 2025,
    endYear: 2026,
    primaryMetric: "234+",
    primaryMetricLabel: "campaign-reported beneficiaries",
    displayOrder: 4,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "dates-distribution",
    title: "Dates Distribution",
    summary: "A community-supported distribution of premium dates during Ramadan.",
    story: "A documented Ramadan distribution supported by multiple donors.",
    primaryMetric: "162 kg",
    primaryMetricLabel: "dates distributed",
    displayOrder: 5,
    causeSlug: "seasonal-food-support",
  },
  {
    slug: "medical-financial-assistance",
    title: "Medical & Financial Assistance",
    summary: "Case-led support for medical emergencies, livelihood needs and financial hardship after review of supporting information.",
    story: "Amaana reviews supporting information and known circumstances before assistance is facilitated or a public appeal is considered.",
    primaryMetric: "₹4.82L",
    primaryMetricLabel: "raised in one documented medical appeal",
    displayOrder: 6,
    causeSlug: "medical-financial-assistance",
  },
  {
    slug: "hyderabad-flood-relief-2020",
    title: "Hyderabad Flood Relief",
    summary: "Relief work from Amaana's earliest grassroots period during the Hyderabad floods of 2020.",
    story: "An early emergency-response activity from the period before Amaana Foundation was formally registered.",
    year: 2020,
    primaryMetric: "2020",
    primaryMetricLabel: "early community relief",
    displayOrder: 7,
    causeSlug: "emergency-relief",
  },
];

async function main() {
  const causeIds = new Map();

  for (const cause of causes) {
    const row = await prisma.cause.upsert({
      where: { slug: cause.slug },
      update: {
        ...cause,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        ...cause,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    causeIds.set(cause.slug, row.id);
  }

  for (const { causeSlug, ...initiative } of initiatives) {
    const causeId = causeIds.get(causeSlug);
    if (!causeId) throw new Error(`Missing cause ${causeSlug}`);

    await prisma.initiative.upsert({
      where: { slug: initiative.slug },
      update: {
        ...initiative,
        causeId,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        ...initiative,
        causeId,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  console.log(`Seeded ${causes.length} causes and ${initiatives.length} initiatives.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
