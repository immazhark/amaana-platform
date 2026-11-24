/** The completed-aid carousel must not imply clinical or financial closure for
 * an ongoing programme, even if its reviewed image is already published.
 * The caller's slug set comes from the independently published, privacy-gated
 * database projection; this predicate adds the canonical completion boundary.
 */
type MedicalAidProgramme = {
  slug: string;
  causeSlug: string;
  programmeStatus?: string;
};

export function selectCompletedMedicalAidShowcase<T extends MedicalAidProgramme>(
  records: readonly T[],
  publishedMediaBackedSlugs: ReadonlySet<string>,
): T[] {
  return records.filter(record =>
    record.causeSlug === "medical-financial-relief"
    && record.programmeStatus === "COMPLETED"
    && publishedMediaBackedSlugs.has(record.slug),
  );
}
