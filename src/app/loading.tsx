export default function Loading() {
  return (
    <section className="v2-loading-page" aria-labelledby="page-loading-title" aria-live="polite">
      <div className="v2-shell v2-loading-shell">
        <p className="v2-section-label">Amaana Foundation</p>
        <h1 id="page-loading-title">Preparing the next page.</h1>
        <p className="v2-loading-copy">Please stay on this page while the next experience is prepared.</p>
        <div className="v2-loading-track" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
