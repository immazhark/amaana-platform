/** Published relationships become public card labels; reject invalid published titles. */
function validPublishedContext(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return true;
  const relation = value as Record<string, unknown>;
  return relation.status !== "PUBLISHED"
    || (typeof relation.title === "string" && relation.title.trim().length > 0);
}

/** Keep only safe public identities and published context before building story links. */
export function retainRoutableStoryRecords<T extends { id: string; slug: string }>(records: readonly T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.filter(record => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const value = record as unknown as Record<string, unknown>;
    const initiative = value.initiative;
    const publishedInitiative = initiative !== null && typeof initiative === "object"
      && !Array.isArray(initiative) && (initiative as Record<string, unknown>).status === "PUBLISHED";
    const nestedCause = initiative && typeof initiative === "object" && !Array.isArray(initiative)
      ? (initiative as Record<string, unknown>).cause : null;
    return typeof value.id === "string" && value.id.trim().length > 0
      && typeof value.slug === "string"
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
      && validPublishedContext(value.cause)
      && validPublishedContext(initiative)
      && (!publishedInitiative || (nestedCause !== null && typeof nestedCause === "object" && !Array.isArray(nestedCause)))
      && validPublishedContext(nestedCause);
  });
}
