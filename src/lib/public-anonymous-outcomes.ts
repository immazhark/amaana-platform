import { AssistanceOutcomeDisclosureState } from "@prisma/client";
import { prisma } from "./prisma";
import {
  ANONYMOUS_OUTCOME_COPY,
  disclosureSourceSelect,
  validatedAnonymousDisclosureEvidenceIds,
} from "./assistance-outcome-disclosure";
import { logServerError } from "./server-log";

const CANDIDATE_LIMIT = 48;
const DISPLAY_LIMIT = 3;

/** Public projection: never return database identifiers, times, source notes,
 * applicant details, amounts, financial references or evidence metadata.
 *
 * Fetch every time the /impact page renders, rather than caching previous
 * consent. If a reviewer withdraws approval or deletes required private
 * evidence, the wording disappears from the next response.
 */
export async function getPublishedAnonymousOutcomeNotes(): Promise<string[]> {
  try {
    const rows = await prisma.assistanceOutcomeDisclosure.findMany({
      where: { state: AssistanceOutcomeDisclosureState.PUBLISHED },
      select: {
        copyText: true, consentDocumentId: true,
        observation: { select: disclosureSourceSelect },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: CANDIDATE_LIMIT,
    });

    const possible = rows.flatMap(row => {
      const source = row.observation;
      const ids = validatedAnonymousDisclosureEvidenceIds(
        source, row.copyText, row.consentDocumentId,
      );
      if (!ids) return [];
      return [{
        copy: ANONYMOUS_OUTCOME_COPY[source.kind],
        caseId: source.assistanceRequestId,
        ids,
      }];
    });
    if (!possible.length) return [];
    const documents = await prisma.assistanceDocument.findMany({
      where: { id: { in: [...new Set(possible.flatMap(item => item.ids))] } },
      select: { id: true, assistanceRequestId: true },
    });
    const available = new Set(documents.map(doc => `${doc.assistanceRequestId}:${doc.id}`));

    const unique = new Set<string>();
    for (const item of possible) {
      if (item.ids.every(id => available.has(`${item.caseId}:${id}`))) {
        unique.add(item.copy);
        if (unique.size === DISPLAY_LIMIT) break;
      }
    }
    return [...unique];
  } catch {
    // Public output fails closed, but the existing impact page remains usable.
    logServerError("impact.anonymous_outcome_projection_unavailable");
    return [];
  }
}
