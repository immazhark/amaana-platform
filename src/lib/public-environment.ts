
export type PublicAppealIdentity = {
  slug: string;
  title: string;
};

export function isSyntheticStagingAppeal(appeal: PublicAppealIdentity) {
  return appeal.slug.toLowerCase().startsWith("staging-") || appeal.title.toLowerCase().startsWith("staging test");
}

export function canExposeSyntheticStagingContent() {
  return process.env.APP_ENVIRONMENT === "staging";
}

export function canExposePublicAppeal(appeal: PublicAppealIdentity) {
  return canExposeSyntheticStagingContent() || !isSyntheticStagingAppeal(appeal);
}
