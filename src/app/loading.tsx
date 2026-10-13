type LoadingContext = "public" | "donation" | "assistance";

const copy: Record<LoadingContext, { eyebrow: string; title: string; status: string }> = {
  public: {
    eyebrow: "Amaana Foundation",
    title: "Preparing this page.",
    status: "Loading documented work and public information.",
  },
  donation: {
    eyebrow: "Secure contribution",
    title: "Preparing donation options.",
    status: "Loading the available ways to contribute.",
  },
  assistance: {
    eyebrow: "Private assistance",
    title: "Preparing your request form.",
    status: "Loading the steps for requesting assistance privately.",
  },
};

export default function Loading({ context = "public" }: { context?: LoadingContext }) {
  const { eyebrow, title, status } = copy[context];
  return (
    <section className="amaana-route-skeleton" aria-labelledby="amaana-loading-heading" aria-busy="true">
      <div className="v2-shell amaana-route-skeleton__layout">
        <div>
          <p className="amaana-route-skeleton__eyebrow">{eyebrow}</p>
          <h1 id="amaana-loading-heading">{title}</h1>
          <p role="status" aria-live="polite">{status}</p>
          <div className="amaana-route-skeleton__bars" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <div className="amaana-route-skeleton__visual" aria-hidden="true">
          <span className="amaana-route-skeleton__mark" />
        </div>
      </div>
    </section>
  );
}
