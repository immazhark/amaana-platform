export default function Loading() {
  return (
    <div className="amaana-route-loading" role="status" aria-live="polite" aria-label="Loading page">
      <span className="amaana-route-loading__mark" aria-hidden="true">AF</span>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
