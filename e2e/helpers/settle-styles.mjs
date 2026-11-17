/**
 * Let style changes finish before measuring computed sizes.
 *
 * The reduced-motion stylesheet sets `transition-duration: 0.01ms !important`
 * and `transition-property` defaults to `all`, so changing the root font size
 * starts a near-instant font-size transition. Reading computed style in the
 * same frame can return a mid-flight value (for example 12px instead of 24px).
 * Two animation frames plus any finished animations remove that race.
 */
export async function settleStyles(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.evaluate(() => Promise.allSettled(document.getAnimations().map(animation => animation.finished)));
}
