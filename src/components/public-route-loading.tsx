import styles from "./public-route-loading.module.css";

type PublicRouteLoadingProps = {
  context: string;
  cards?: 3 | 4;
};

/** Server-rendered, accessible skeleton with no invented photographs or figures. */
export function PublicRouteLoading({ context, cards = 3 }: PublicRouteLoadingProps) {
  return (
    <div className={styles.shell} role="status" aria-busy="true" aria-label={`Loading ${context}`}>
      <div className={styles.hero} aria-hidden="true">
        <div className={styles.heroInner}>
          <span className={styles.line} />
          <span className={`${styles.line} ${styles.headline}`} />
          <span className={styles.line} />
          <span className={styles.line} />
          <span className={styles.line} />
        </div>
      </div>
      <div className={styles.body} aria-hidden="true">
        <div className={styles.sectionHeading}>
          <div className={styles.sectionCopy}>
            <span className={styles.line} />
            <span className={`${styles.line} ${styles.headline}`} />
          </div>
        </div>
        <div className={`${styles.grid} ${cards === 4 ? styles.gridFour : ""}`} data-grid-columns={cards}>
          {Array.from({ length: cards }, (_, index) => (
            <div className={styles.card} key={index} data-loading-card="true">
              <div className={styles.image} />
              <div className={styles.cardContent}>
                <span className={styles.line} />
                <span className={styles.line} />
                <span className={styles.line} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className={styles.screenReaderOnly}>Loading {context}. Content is being prepared.</span>
    </div>
  );
}
