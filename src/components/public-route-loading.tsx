import styles from "./public-route-loading.module.css";

export type PublicRouteLoadingProps = {
  section: string;
  variant?: "index" | "detail";
};

/**
 * A restrained App Router fallback, not a second page or a progress
 * percentage. It renders no personal or fabricated beneficiary imagery.
 * Decorative geometry is hidden from assistive technology; one live
 * announcement identifies which public route is loading.
 */
export function PublicRouteLoading({ section, variant = "index" }: PublicRouteLoadingProps) {
  const detail = variant === "detail";
  const cards = detail ? 2 : 3;

  return (
    <div className={styles.page} data-public-route-loading={variant}>
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
        Loading {section}.
      </p>

      {/* Keep the live announcement outside the busy region so screen
          readers hear it while the streamed route remains unresolved. */}
      <div aria-busy="true">
        <section className={styles.hero} aria-hidden="true">
          <div className={styles.shell}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow} />
                <div className={styles.title} />
                <div className={styles.titleShort} />
                <div className={styles.description} />
                <div className={styles.descriptionShort} />
                <div className={styles.actions}>
                  <div className={styles.button} />
                  <div className={styles.buttonSecondary} />
                </div>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.geometry} />
              </div>
            </div>
          </div>
        </section>
  
        <section className={styles.content} aria-hidden="true">
          <div className={styles.shell}>
            <div className={styles.sectionLabel} />
            <div className={styles.sectionTitle} />
            <div className={detail ? styles.detailGrid : styles.cardGrid}>
              {Array.from({ length: cards }, (_, index) => (
                <div className={styles.card} key={index}>
                  <div className={styles.cardVisual} />
                  <div className={styles.cardCopy}>
                    <div className={styles.cardEyebrow} />
                    <div className={styles.cardTitle} />
                    <div className={styles.cardDescription} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
