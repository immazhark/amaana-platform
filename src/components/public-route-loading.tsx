import styles from "./public-route-loading.module.css";
import { CanonicalArticle } from "./canonical-article";

type PublicLoadingRoute =
  | "stories"
  | "our-work"
  | "impact"
  | "impact-compare"
  | "appeals"
  | "faith-and-reflections"
  | "donate";

const routeCopy: Record<PublicLoadingRoute, { title: string; message: string }> = {
  "stories": { title: "Stories of Amanah", message: "Loading published stories…" },
  "our-work": { title: "Our Work", message: "Loading published initiatives…" },
  "impact": { title: "Our Impact", message: "Loading documented outcomes…" },
  "impact-compare": { title: "Compare Documented Impact", message: "Loading published initiatives to compare…" },
  "appeals": { title: "Verified Appeals", message: "Checking current public appeals…" },
  "faith-and-reflections": { title: "Faith & Reflections", message: "Loading the reviewed library…" },
  "donate": { title: "Domestic Donations", message: "Checking currently approved giving routes…" },
};

/** An App Router transition fallback. Never render provisional database facts,
 * people, fundraising counters, links or media before publication checks finish. */
export function PublicRouteLoading({ route }: { route: PublicLoadingRoute }) {
  const { title, message } = routeCopy[route];
  // Keep the matched donation page's standard hero/body geometry available
  // while current checkout eligibility and verified balances are resolved.
  if (route === "donate") {
    return (
      <CanonicalArticle
        title={title}
        eyebrow="Donate · Amaana Foundation"
        intro="Checking current domestic giving availability."
        heroVariant="action"
        heroVisualTitle={title}
        heroVisualNote={message}
        heroActions={[]}
        blocks={[]}
      >
        <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {message}
        </p>
      </CanonicalArticle>
    );
  }

  return (
    <section className={styles.root} aria-labelledby="public-route-loading-title">
      <div className={styles.hero}>
        <div className={[styles.shell, styles.heroGrid].join(" ")}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Amaana Foundation · {title}</p>
            <h1 className={styles.heading} id="public-route-loading-title">{title}</h1>
            <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">{message}</p>
            <div className={styles.lines} aria-hidden="true">
              <span className={styles.line} /><span className={styles.shortLine} />
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true"><span /></div>
        </div>
      </div>
      <div className={styles.shell}>
        <div className={styles.cards} aria-hidden="true">
          {[0, 1, 2].map(index => (
            <div className={styles.card} key={index}>
              <div className={styles.cardTop} />
              <div className={styles.cardBody}>
                <span className={styles.line} /><span className={styles.shortLine} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
