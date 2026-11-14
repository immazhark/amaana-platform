/** Keep only routable identity rows before querying public story cards by ID. */
export function retainRoutableStoryRecords<T extends { id: string; slug: string }>(records: readonly T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.filter(record => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const identity = record as { id?: unknown; slug?: unknown };
    return typeof identity.id === "string" && identity.id.trim().length > 0
      && typeof identity.slug === "string"
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.slug);
  });
}
