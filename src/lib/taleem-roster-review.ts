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
  const learnerByAlias = new Map(learners.map(learner => [learner.publicAlias, learner]));
  const programmeStatus = (["QAIDA", "NAZIRA", "HIFDH", "UNCLASSIFIED"] as const).map(programme => ({ programme, active: 0, onBreak: 0, inactive: 0, unknownStatus: 0 }));
  const naziraHifdh = new Set<string>();
  const unmatchedOccupiedPlaces: string[] = [];
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
    if (place.status !== "MAINTAINED") continue;
    if (place.holderAlias !== null) {
      const learner = learnerByAlias.get(place.holderAlias);
      if (!learner || learner.placeCode !== place.placeCode) {
        unmatchedOccupiedPlaces.push(place.placeCode);
        continue;
      }
      const row = programmeStatus.find(item => item.programme === learner.programme) ?? programmeStatus[3]!;
      if (learner.status === "ACTIVE") row.active += 1;
      else if (learner.status === "ON_BREAK") row.onBreak += 1;
      else if (learner.status === "LEFT" || learner.status === "GRADUATED") row.inactive += 1;
      else row.unknownStatus += 1;
      continue;
    }
    (place.hasBlockingAssignment ? reservedVacancies : assignableVacancies).push(place.placeCode);
  }
  return { programmeStatus, unmatchedOccupiedPlaces, naziraHifdhStudents: naziraHifdh.size, missingProgramme, inactiveHolders, placeConflicts, pendingMilestones, assignableVacancies, reservedVacancies };
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

const rosterProgrammeFilters = ["QAIDA", "NAZIRA", "HIFDH", "UNCLASSIFIED"] as const;
const rosterStatusFilters = ["ACTIVE", "ON_BREAK", "LEFT", "GRADUATED"] as const;
const rosterPlacementFilters = ["CURRENT", "RESERVED", "UNASSIGNED"] as const;

function rosterFilterValue<T extends string>(value: unknown, choices: readonly T[]): T | "ALL" {
  return choices.find(choice => choice === value) ?? "ALL";
}

/** Fixed non-identifying GET values only. Repeated or unknown inputs are ignored. */
export function rosterLearnerFilters(input: { programmeFilter?: unknown; statusFilter?: unknown; placementFilter?: unknown }) {
  return {
    programme: rosterFilterValue(input.programmeFilter, rosterProgrammeFilters),
    status: rosterFilterValue(input.statusFilter, rosterStatusFilters),
    placement: rosterFilterValue(input.placementFilter, rosterPlacementFilters),
  };
}

/** Filter only the learner directory, not the full-roster aggregates or assignment availability. */
export function filterRosterLearners<T extends Pick<ReviewLearner, "programme" | "status" | "placeCode" | "hasBlockingAssignment">>(
  learners: readonly T[], filters: ReturnType<typeof rosterLearnerFilters>,
): T[] {
  return learners.filter(learner => {
    const programme = learner.programme ?? "UNCLASSIFIED";
    const placement = learner.placeCode !== null ? "CURRENT" : learner.hasBlockingAssignment ? "RESERVED" : "UNASSIGNED";
    return (filters.programme === "ALL" || filters.programme === programme)
      && (filters.status === "ALL" || filters.status === learner.status)
      && (filters.placement === "ALL" || filters.placement === placement);
  });
}
