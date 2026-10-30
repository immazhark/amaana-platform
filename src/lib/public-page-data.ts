import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { getAppealCoverMediaIssues } from "@/lib/appeal-cover-media";
import { prisma } from "@/lib/prisma";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { canExposeAppealArchive } from "@/lib/appeal-update-publication";
import { canExposePublicAppeal, canExposeSyntheticStagingContent } from "@/lib/public-environment";
import { IDENTITY_MEDIA_SORT_ORDER } from "@/lib/public-media";
import { programmes } from "@/lib/master-copy";
import {
  getPublishedFaithContentBySlug,
  getPublishedInitiativeBySlug,
  getPublishedStoryBySlug,
} from "@/lib/public-content";

export const PUBLIC_APPROVED_IMAGE_WHERE = {
  kind: "IMAGE" as const,
  isPublic: true,
  privacyApprovedAt: { not: null },
  publicUrl: { not: null },
  altText: { not: "" },
};

export const PUBLIC_IDENTITY_IMAGE_WHERE = {
  ...PUBLIC_APPROVED_IMAGE_WHERE,
  sortOrder: IDENTITY_MEDIA_SORT_ORDER,
};

export const PUBLIC_IMAGE_SELECT = {
  id: true,
  kind: true,
  title: true,
  publicUrl: true,
  externalUrl: true,
  altText: true,
  caption: true,
  sourceYear: true,
  width: true,
  height: true,
  sortOrder: true,
} as const;

export const PUBLIC_GALLERY_MEDIA_PROJECTION = {
  where: PUBLIC_APPROVED_IMAGE_WHERE,
  orderBy: [
    { sortOrder: "asc" as const },
    { sourceYear: "desc" as const },
    { createdAt: "desc" as const },
  ],
  take: 12,
  select: PUBLIC_IMAGE_SELECT,
};

const CANONICAL_PROGRAMME_SLUGS = programmes.map(programme => programme.slug);
const CANONICAL_PROGRAMME_SLUG_SET = new Set(CANONICAL_PROGRAMME_SLUGS);

/**
 * React request memoization for dynamic routes whose metadata and page body
 * need the same public record. This keeps metadata generation from causing a
 * second identical Prisma read during one render request while preserving the
 * existing publication/privacy gates in the underlying getters.
 */
export const getInitiativePageData = getPublishedInitiativeBySlug;
export const getStoryPageData = cache(getPublishedStoryBySlug);
export const getFaithPageData = cache(getPublishedFaithContentBySlug);

export const getAppealPageData = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      beneficiaryLocation: true,
      beneficiaryDisplayName: true,
      story: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
      publishedAt: true,
      coverImageUrl: true,
      assistanceRequest: {
        select: {
          id: true,
          verification: { select: { archiveConsent: true } },
        },
      },
      updates: {
        where: { isPublic: true },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!appeal || !canExposePublicAppeal(appeal)) return null;
  if (!canExposeAppealArchive({
    appealStatus: appeal.status,
    hasAssistanceRequest: Boolean(appeal.assistanceRequest),
    archiveConsent: appeal.assistanceRequest?.verification?.archiveConsent,
  })) return null;

  const { assistanceRequest: privateVerificationContext, ...publicAppeal } = appeal;
  void privateVerificationContext;
  return publicAppeal;
});

export const getHomepageHeroMedia = cache(async () => {
  return prisma.mediaAsset.findFirst({
    where: {
      kind: "IMAGE",
      isPublic: true,
      privacyApprovedAt: { not: null },
      publicUrl: { not: null },
      sortOrder: IDENTITY_MEDIA_SORT_ORDER,
      OR: [
        { initiative: { status: "PUBLISHED", cause: { status: "PUBLISHED" } } },
        { story: { status: "PUBLISHED", privacyApprovedAt: { not: null } } },
      ],
    },
    orderBy: [{ sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      kind: true,
      title: true,
      publicUrl: true,
      externalUrl: true,
      altText: true,
      caption: true,
      sourceYear: true,
      width: true,
      height: true,
      initiative: { select: { slug: true, title: true } },
      story: { select: { slug: true, title: true } },
    },
  });
});

/**
 * Lean discovery projection for the dynamic homepage.
 *
 * Home only needs featured/specified programme records and a few identity-image
 * candidates per umbrella area. This avoids serializing the full annual archive
 * on every homepage request.
 */
export const getHomepageDiscoveryData = cache(async () => {
  const fieldSlugs = ["qurbani-meat-distribution-2026", "dates-distribution-2026"];

  // This projection is used only by the verified-outcomes strip. Programme
  // artwork comes from the separate reviewed cause/identity-media query below.
  // Avoid fetching unused image rows, relations, and extended initiative copy.
  const homepageInitiativeSelect = {
    slug: true,
    title: true,
    primaryMetric: true,
    primaryMetricLabel: true,
  } satisfies Prisma.InitiativeSelect;

  const [featuredInitiatives, fieldInitiatives, causes, publishedProgrammeRecords] = await Promise.all([
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        cause: { status: "PUBLISHED" },
        isFeatured: true,
        mediaAssets: { some: PUBLIC_IDENTITY_IMAGE_WHERE },
      },
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      take: 5,
      select: homepageInitiativeSelect,
    }),
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        cause: { status: "PUBLISHED" },
        slug: { in: fieldSlugs },
      },
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      select: homepageInitiativeSelect,
    }),
    prisma.cause.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      select: {
        slug: true,
        initiatives: {
          where: {
            status: "PUBLISHED",
            mediaAssets: { some: PUBLIC_IDENTITY_IMAGE_WHERE },
          },
          orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
          take: 4,
          select: {
            mediaAssets: {
              where: PUBLIC_IDENTITY_IMAGE_WHERE,
              orderBy: [{ sourceYear: "desc" }, { createdAt: "desc" }],
              take: 1,
              select: PUBLIC_IMAGE_SELECT,
            },
          },
        },
      },
    }),
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        cause: { status: "PUBLISHED" },
        slug: { in: CANONICAL_PROGRAMME_SLUGS },
      },
      select: { slug: true },
    }),
  ]);

  const initiativesBySlug = new Map(
    [...featuredInitiatives, ...fieldInitiatives].map(record => [record.slug, record] as const),
  );

  return {
    initiatives: Array.from(initiativesBySlug.values()),
    causes,
    publishedProgrammeSlugs: publishedProgrammeRecords.map(record => record.slug),
  };
});

/**
 * Lean discovery projection for /our-work.
 *
 * The index only needs public cause copy, initiative summaries/metrics and one
 * approved documentary image per initiative. It deliberately avoids loading
 * stories, appeals, faith content, financial summaries and full media galleries.
 */
export const getOurWorkIndexData = cache(async () => {
  return prisma.cause.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      initiatives: {
        where: { status: "PUBLISHED" },
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          year: true,
          startYear: true,
          endYear: true,
          isFeatured: true,
          primaryMetric: true,
          primaryMetricLabel: true,
          mediaAssets: {
            where: PUBLIC_IDENTITY_IMAGE_WHERE,
            orderBy: [{ sourceYear: "desc" }],
            // Keep fallback candidates when a newer image fails URL/alt validation.
            take: 12,
            select: PUBLIC_IMAGE_SELECT,
          },
        },
      },
    },
  });
});

/**
 * Impact only needs public initiative identity, cause context, metrics and a
 * single approved witness image. Keeping this separate avoids serializing full
 * initiative stories and complete media galleries on the evidence index.
 */
export const getImpactPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      cause: { select: { title: true } },
      mediaAssets: {
        // Only identity-approved images can appear in the hero, tiles or witness carousel.
        // Keep the bounded candidate window to preserve safe fallback among identity images.
        where: PUBLIC_IDENTITY_IMAGE_WHERE,
        orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }],
        take: 12,
        select: PUBLIC_IMAGE_SELECT,
      },
    },
  });
});

/**
 * Comparison does not render media. Fetching approved gallery records for every
 * initiative here increases DB reads and SSR payload without a visible result.
 * Keep the same published/filtered portfolio and stable ordering as /impact.
 */
export const getImpactComparisonPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      cause: { select: { title: true } },
    },
  });
});

/**
 * Completed-case showcase for /appeals. Keep this intentionally narrow: only
 * curated medical/financial programmes can appear in the card strip. Do not
 * load gallery rows for published initiatives that the page cannot display.
 */
const COMPLETED_AID_PROGRAMME_SLUGS = programmes
  .filter(programme => programme.causeSlug === "medical-financial-relief")
  .map(programme => programme.slug);

export const getCompletedAidShowcaseData = cache(async () => {
  return prisma.initiative.findMany({
    where: {
      status: "PUBLISHED",
      cause: { slug: "medical-financial-relief", status: "PUBLISHED" },
      slug: { in: COMPLETED_AID_PROGRAMME_SLUGS },
    },
    orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      slug: true,
      mediaAssets: PUBLIC_GALLERY_MEDIA_PROJECTION,
    },
  });
});

/**
 * Appeals index projection. The card grid needs only public fundraising fields;
 * it should not serialize the private-facing story, internal notes or updates.
 */
export const getAppealsIndexData = cache(async () => {
  const where: Prisma.AppealWhereInput = {
    status: "PUBLISHED",
    amountRaised: { lt: prisma.appeal.fields.goalAmount },
    OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
  };
  if (!canExposeSyntheticStagingContent()) {
    where.NOT = [
      { slug: { startsWith: "staging-" } },
      { title: { startsWith: "STAGING TEST" } },
    ];
  }
  return prisma.appeal.findMany({
    // Match the existing server-rendered checkout eligibility preconditions
    // before retrieving card records. The page still applies the full balance,
    // staging and time checks as the final public presentation guard.
    where,
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }, { id: "asc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      beneficiaryLocation: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
    },
  });
});

/**
 * Donation page projection. Checkout is available only while the appeal is
 * published, below target and inside any configured fundraising window.
 */
const DONATION_PAGE_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  beneficiaryLocation: true,
  category: true,
  status: true,
  goalAmount: true,
  amountRaised: true,
  closesAt: true,
  assistanceRequest: {
    select: { verification: { select: { zakatStatus: true } } },
  },
} as const satisfies Prisma.AppealSelect;

type DonationAppealRecord = Prisma.AppealGetPayload<{ select: typeof DONATION_PAGE_SELECT }>;

/** One disclosure boundary for both detail and batch donation projections. */
function projectPublicDonationAppeal(appeal: DonationAppealRecord | null) {
  if (!appeal || !canExposePublicAppeal(appeal) || !isAppealOpenForDonations(appeal)) return null;
  const { assistanceRequest, ...publicAppeal } = appeal;
  return {
    ...publicAppeal,
    zakatEligible: assistanceRequest?.verification?.zakatStatus === "ELIGIBLE",
  };
}

export const getDonationPageData = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: DONATION_PAGE_SELECT,
  });
  return projectPublicDonationAppeal(appeal);
});

/**
 * Read up to four payable public appeals in priority order. Use database
 * filters to avoid an unbounded public index read on every /donate request.
 * The server still rechecks exact balance and disclosure before rendering.
 */
export async function getReviewedDonationPageData() {
  const now = new Date();
  const where: Prisma.AppealWhereInput = {
    status: "PUBLISHED",
    amountRaised: { lt: prisma.appeal.fields.goalAmount },
    OR: [{ closesAt: null }, { closesAt: { gt: now } }],
  };
  if (!canExposeSyntheticStagingContent()) {
    where.NOT = [
      { slug: { startsWith: "staging-" } },
      { title: { startsWith: "STAGING TEST" } },
    ];
  }

  const selected: NonNullable<ReturnType<typeof projectPublicDonationAppeal>>[] = [];
  let cursor: string | undefined;
  // A rare sub-₹10 fractional balance can pass the SQL comparison but cannot
  // be checked out. Scan bounded pages so it does not hide a later payable case.
  for (let scanned = 0; scanned < 48 && selected.length < 4; scanned += 12) {
    const records = await prisma.appeal.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { publishedAt: "desc" },
        { id: "asc" },
      ],
      take: 12,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: DONATION_PAGE_SELECT,
    });
    for (const record of records) {
      const payable = projectPublicDonationAppeal(record);
      if (payable) selected.push(payable);
      if (selected.length === 4) break;
    }
    if (records.length < 12) break;
    cursor = records[records.length - 1]?.id;
  }
  return selected;
}

/**
 * A bounded, reviewed projection for donor-facing published programme outcomes.
 * No donor identities, private assistance information or payment totals leave
 * this select. Public visibility is controlled by both initiative and cause.
 */
export const getDonationImpactHighlights = cache(async () => {
  const rows = await prisma.initiative.findMany({
    where: {
      status: "PUBLISHED",
      cause: { status: "PUBLISHED" },
      slug: { in: CANONICAL_PROGRAMME_SLUGS },
      primaryMetric: { not: null },
      primaryMetricLabel: { not: null },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
    take: 8,
    select: { slug: true, title: true, primaryMetric: true, primaryMetricLabel: true },
  });
  return rows.filter(item => CANONICAL_PROGRAMME_SLUG_SET.has(item.slug)
    && item.primaryMetric?.trim() && item.primaryMetricLabel?.trim()).slice(0, 3);
});

/**
 * Transparency needs initiative identity, cause context and published metrics,
 * but not galleries, appeals, stories or financial-summary relations.
 */
export const getTransparencyPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      cause: { select: { title: true } },
    },
  });
});


/**
 * A bounded set of reviewed image candidates per child programme, fetched in one query.
 * Programme surfaces can prefer authentic approved gallery photography while retaining
 * identity/artwork fallbacks without N+1 reads or weaker privacy gates.
 */
export const getProgrammeChildMedia = cache(async (slugs: string[]) => {
  if (!slugs.length) return [];
  return prisma.initiative.findMany({
    where: { slug: { in: slugs }, status: "PUBLISHED", cause: { status: "PUBLISHED" } },
    select: {
      slug: true,
      mediaAssets: PUBLIC_GALLERY_MEDIA_PROJECTION,
    },
  });
});


/**
 * Approved cover media for a public appeal.
 *
 * The appeal editor already requires cover images to match a reviewed Media
 * library record. Public rendering repeats the same fail-closed publication
 * boundary so an old or subsequently revoked URL cannot leak into the hero.
 */
export type ApprovedAppealCoverMedia = {
  id: string;
  kind: "IMAGE";
  title: string | null;
  publicUrl: string | null;
  externalUrl: string | null;
  altText: string | null;
  caption: string | null;
  sourceYear: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

/**
 * Batch the reviewed cover-media lookup used by homepage and carousel surfaces.
 *
 * This preserves the existing privacy-review fail-closed rule while avoiding
 * two extra database reads per appeal/image (media + audit event).
 */
export async function getAppealCoverMediaBatch(
  coverImageUrls: readonly (string | null | undefined)[],
) {
  const urls = [...new Set(coverImageUrls.filter((url): url is string => Boolean(url)))];
  if (!urls.length) return new Map<string, ApprovedAppealCoverMedia>();

  const media = await prisma.mediaAsset.findMany({
    where: {
      ...PUBLIC_APPROVED_IMAGE_WHERE,
      publicUrl: { in: urls },
    },
    select: {
      ...PUBLIC_IMAGE_SELECT,
      isPublic: true,
      privacyApprovedAt: true,
    },
  });

  if (!media.length) return new Map<string, ApprovedAppealCoverMedia>();

  const reviews = await prisma.auditEvent.findMany({
    where: {
      entityType: "MediaAsset",
      entityId: { in: media.map(asset => asset.id) },
      action: "media.privacy_reviewed",
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { entityId: true, metadata: true },
  });

  const latestReviewByAsset = new Map<string, (typeof reviews)[number]["metadata"]>();
  for (const review of reviews) {
    if (!latestReviewByAsset.has(review.entityId)) {
      latestReviewByAsset.set(review.entityId, review.metadata);
    }
  }

  const approved = new Map<string, ApprovedAppealCoverMedia>();
  for (const asset of media) {
    if (!asset.publicUrl) continue;
    if (getAppealCoverMediaIssues(asset, latestReviewByAsset.get(asset.id)).length > 0) continue;

    approved.set(asset.publicUrl, {
      id: asset.id,
      kind: "IMAGE",
      title: asset.title,
      publicUrl: asset.publicUrl,
      externalUrl: asset.externalUrl,
      altText: asset.altText,
      caption: asset.caption,
      sourceYear: asset.sourceYear,
      width: asset.width,
      height: asset.height,
      sortOrder: asset.sortOrder,
    });
  }

  return approved;
}

export const getAppealCoverMedia = cache(async (coverImageUrl: string | null | undefined) => {
  if (!coverImageUrl) return null;
  const media = await getAppealCoverMediaBatch([coverImageUrl]);
  return media.get(coverImageUrl) ?? null;
});
