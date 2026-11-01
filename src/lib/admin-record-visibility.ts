import type { AppealStatus, AssistanceStatus, Prisma } from "@prisma/client";

// These are the exact historical acceptance fixtures found in the production
// database. Other records, even those containing words like "test", must not
// disappear from a live case or appeal queue without individual review.
export const STAGING_ASSISTANCE_REFERENCE = "AF-STAGING-ACCEPTANCE";
export const STAGING_APPEAL_SLUG = "staging-checkout-acceptance";

export type AdminRecordView = "live" | "tests";

export function adminRecordView(raw: unknown): AdminRecordView {
  return raw === "tests" ? "tests" : "live";
}

export function assistanceAdminWhere(
  view: AdminRecordView,
  status?: AssistanceStatus,
): Prisma.AssistanceRequestWhereInput {
  return {
    referenceNumber: view === "tests"
      ? STAGING_ASSISTANCE_REFERENCE
      : { not: STAGING_ASSISTANCE_REFERENCE },
    ...(status ? { status } : {}),
  };
}

export function appealAdminWhere(
  view: AdminRecordView,
  status?: AppealStatus,
): Prisma.AppealWhereInput {
  return {
    slug: view === "tests" ? STAGING_APPEAL_SLUG : { not: STAGING_APPEAL_SLUG },
    ...(status ? { status } : {}),
  };
}
