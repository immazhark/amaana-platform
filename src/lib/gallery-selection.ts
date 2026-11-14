/** Navigate by stable media identity rather than a mutable array position. */
export function adjacentGalleryId(
  items: readonly { id: string }[],
  currentId: string | null,
  direction: -1 | 1,
): string | null {
  if (!Array.isArray(items)) return null;
  const eligible = items.filter(item =>
    item && typeof item === "object" && typeof item.id === "string" && !!item.id.trim(),
  );
  const length = eligible.length;
  if (!length) return null;
  const index = eligible.findIndex(item => item.id === currentId);
  return eligible[index < 0 ? 0 : (index + direction + length) % length]?.id ?? null;
}
