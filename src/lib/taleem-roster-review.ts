type ReviewLearner = {
  publicAlias: string;
  status: string;
  programme: string | null;
  placeCode: string | null;
  hasBlockingAssignment: boolean;
  completedHifdhOn: string | null;
  completionReview?: { verified: boolean; supportAssociated: boolean } | null;
};
type ReviewPlace = { placeCode: string; status: string; holderAlias: string | null; hasBlockingAssignment: boolean };

/** Private review prompts, not eligibility decisions or new public impact claims. */
export function rosterReview(learners: readonly ReviewLearner[], places: readonly ReviewPlace[]) {
  const placeByCode = new Map(places.map(place => [place.placeCode, place]));
  const naziraHifdh = new Set<string>();
  const missingProgramme: string[] = [];
  const inactiveHolders: string[] = [];
  const placeConflicts: string[] = [];
  const pendingMilestones: string[] = [];
  const assignableVacancies: string[] = [];
  const reservedVacancies: string[] = [];
  for (const learner of learners) {
    if (learner.placeCode !== null) {
      const place = placeByCode.get(learner.placeCode);
      if (!place || place.status !== "MAINTAINED" || place.holderAlias !== learner.publicAlias) placeConflicts.push(learner.publicAlias);
      else if (learner.programme === "NAZIRA" || learner.programme === "HIFDH") naziraHifdh.add(learner.publicAlias);
      if (learner.programme === null) missingProgramme.push(learner.publicAlias);
      if (learner.status === "LEFT" || learner.status === "GRADUATED") inactiveHolders.push(learner.publicAlias);
    }
    if (learner.completedHifdhOn !== null && (!learner.completionReview?.verified || !learner.completionReview.supportAssociated)) pendingMilestones.push(learner.publicAlias);
  }
  for (const place of places) {
    if (place.status !== "MAINTAINED" || place.holderAlias !== null) continue;
    (place.hasBlockingAssignment ? reservedVacancies : assignableVacancies).push(place.placeCode);
  }
  return { naziraHifdhStudents: naziraHifdh.size, missingProgramme, inactiveHolders, placeConflicts, pendingMilestones, assignableVacancies, reservedVacancies };
}

type Evidence = { verified: boolean; supportAssociated: boolean };
/** Confirm evidence independently. Never downgrade an existing confirmation or change the completion date. */
export function milestoneConfirmationPlan(current: Evidence & { completedOn: string }, requested: Evidence, day: string):
  | { kind: "empty" | "future" | "unchanged" }
  | ({ kind: "update" } & Evidence) {
  if (!requested.verified && !requested.supportAssociated) return { kind: "empty" };
  if (current.completedOn > day) return { kind: "future" };
  const verified = current.verified || requested.verified;
  const supportAssociated = current.supportAssociated || requested.supportAssociated;
  if (verified === current.verified && supportAssociated === current.supportAssociated) return { kind: "unchanged" };
  return { kind: "update", verified, supportAssociated };
}
