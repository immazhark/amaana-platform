import styles from "./route-loading-skeleton.module.css";

type Variant = "donate" | "appeals" | "impact" | "work"
  | "appeal-detail" | "programme-detail" | "story-detail";

const announcements: Record<Variant, string> = {
  donate: "Checking currently approved donation routes…",
  appeals: "Loading reviewed appeal information…",
  impact: "Loading published impact records…",
  work: "Loading published programmes…",
  "appeal-detail": "Loading reviewed appeal details…",
  "programme-detail": "Loading published programme details…",
  "story-detail": "Loading approved story details…",
};

/**
 * Route-level streaming fallback: placeholders are purely structural.
 * Never suggest an appeal, amount, donor identity or payment choice until
 * that page's fresh reviewed server projection has resolved.
 */
export function RouteLoadingSkeleton({ variant }: { variant: Variant }) {
  const count = variant === "donate" || variant.endsWith("-detail") ? 2 : 3;

  return <section className={styles.root} aria-label={announcements[variant]} data-loading-variant={variant}>
    <p role="status" aria-live="polite" className={styles.announcement}>{announcements[variant]}</p>
    <div className={styles.shell} aria-hidden="true">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker} />
          <span className={styles.title} />
          <span className={styles.titleShort} />
          <span className={styles.paragraph} />
          <span className={styles.paragraphShort} />
          <span className={styles.action} />
        </div>
        <div className={styles.visual}><span className={styles.emblem} /></div>
      </div>
      <div className={styles.body}>
        <div className={styles.heading}><span /><span /></div>
        <div className={styles.grid}>
          {Array.from({ length: count }, (_, index) =>
            <div className={styles.card} key={index}>
              <span className={styles.cardImage} />
              <span className={styles.cardTitle} />
              <span className={styles.cardCopy} />
              <span className={styles.cardCopyShort} />
            </div>)}
        </div>
      </div>
    </div>
  </section>;
}
