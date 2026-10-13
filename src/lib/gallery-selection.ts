/** Navigate by stable media identity rather than a mutable array position. */
export function adjacentGalleryId(
  items: readonly { id: string }[],
  currentId: string | null,
  direction: -1 | 1,
): string | null {
  const length = items.length;
  if (!length) return null;
  const index = items.findIndex(item => item.id === currentId);
  return items[index < 0 ? 0 : (index + direction + length) % length]?.id ?? null;
}
