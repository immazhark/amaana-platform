/**
 * Review only a bounded number of public appeal candidates in batches.
 * Published listings may have been fully funded or closed since indexing.
 * Do not allow the first four stale listings to conceal a later payable one.
 */
export async function selectReviewedDonationCandidates<Candidate, Reviewed>(
  candidates: readonly Candidate[],
  review: (candidate: Candidate) => Promise<Reviewed | null>,
): Promise<Reviewed[]> {
  const maxResults = 4;
  const maxInspected = Math.min(candidates.length, 12);
  const result: Reviewed[] = [];
  for (let start = 0; start < maxInspected && result.length < maxResults; start += 4) {
    const batch = candidates.slice(start, Math.min(start + 4, maxInspected));
    const reviewed = await Promise.all(batch.map(review));
    for (const choice of reviewed) {
      if (choice === null) continue;
      result.push(choice);
      if (result.length === maxResults) break;
    }
  }
  return result;
}
