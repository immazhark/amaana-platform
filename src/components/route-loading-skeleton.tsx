import styles from "./route-loading-skeleton.module.css";

type Variant = "donate" | "appeals" | "impact" | "work" | "detail";
type Props = {
  variant: Variant;
};

const labels: Record<Variant, string> = {
  donate: "Checking currently approved donation routes…",
  appeals: "Loading reviewed appeal information…",
  impact: "Loading published impact records…",
  work: "Loading published programmes…",
  detail: "Loading reviewed programme details…",
};

/** Content-layout fallback, never a fabricated figure, beneficiary profile,
 * payment form or image. One screen-reader status; decorative blocks hidden. */
export function RouteLoadingSkeleton({ variant }: Props) {
  const isDetail = variant === "detail";
  const isDonate = variant === "donate";
  return <section className={styles.root} aria-label={labels[variant]} data-loading-variant={variant}>
    <p className={styles.announcement} role="status" aria-live="polite">{labels[variant]}</p>
    <div className={styles.shell} aria-hidden="true">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}/>
          <span className={styles.title}/>
          <span className={styles.titleShort}/>
          <span className={styles.paragraph}/>
          <span className={styles.paragraphShort}/>
          <span className={styles.action}/>
        </div>
        <div className={styles.visual}><span className={styles.emblem}/></div>
      </div>
      <div className={styles.body}>
        <div className={styles.heading}><span/><span/></div>
        <div className={styles.grid}>
          {Array.from({ length: isDonate ? 2 : isDetail ? 2 : 3 }, (_, index) =>
            <div className={styles.card} key={index}>
              <span className={styles.cardImage}/>
              <span className={styles.cardTitle}/>
              <span className={styles.cardCopy}/>
              <span className={styles.cardCopyShort}/>
            </div>)}
        </div>
      </div>
    </div>
  </section>;
}
