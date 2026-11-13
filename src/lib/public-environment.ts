
export type PublicAppealIdentity = {
  slug: string;
  title: string;
};

export function isSyntheticStagingAppeal(appeal: PublicAppealIdentity) {
  return appeal.slug.startsWith("staging-") || appeal.title.startsWith("STAGING TEST");
}

export function canExposeSyntheticStagingContent() {
  return process.env.APP_ENVIRONMENT === "staging";
}

export function canExposePublicAppeal(appeal: PublicAppealIdentity) {
  return canExposeSyntheticStagingContent() || !isSyntheticStagingAppeal(appeal);
}
