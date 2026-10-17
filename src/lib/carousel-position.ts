/** Resolve the actual browser-reachable scroll destination for a carousel.
 * Slide offsets beyond the track's maximum scroll must not leave a pending
 * programmatic navigation that can never complete. */
export function boundedCarouselScrollLeft(offset: number, scrollWidth: number, clientWidth: number) {
  const max = Math.max(0, scrollWidth - clientWidth);
  return Math.min(Math.max(0, offset), max);
}

/** Reconcile manually scrolled positions with the same reachable geometry.
 * A last slide can share the edge position with preceding cards; when tied
 * prefer the later card rather than showing an earlier status at track end. */
export function closestCarouselIndex(
  offsets: readonly (number | null)[],
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
) {
  // When the full track fits, no manual scroll position exists to infer.
  if (scrollWidth <= clientWidth) return 0;
  let selected = 0;
  let distance = Number.POSITIVE_INFINITY;
  offsets.forEach((offset, index) => {
    if (offset === null) return;
    const candidate = boundedCarouselScrollLeft(offset, scrollWidth, clientWidth);
    const currentDistance = Math.abs(candidate - scrollLeft);
    if (currentDistance <= distance) {
      selected = index;
      distance = currentDistance;
    }
  });
  return selected;
}
