import type { CSSProperties } from "react";

type Layout = "cards" | "form" | "editorial";
const bar: CSSProperties = { background: "var(--af-color-blue-note)", height: "1rem", borderRadius: ".4rem" };
const grid: CSSProperties = {
  display: "grid", gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,16rem),1fr))",
};

/** Shape-only, nonanimated client-navigation feedback; never represents
 * real funds, donor records or private beneficiary evidence. */
export function RouteLoadingSkeleton({ label, layout = "cards" }: {
  label: string; layout?: Layout;
}) {
  return <section className="v2-shell" role="status" aria-live="polite"
    aria-busy="true" data-loading-view={layout}>
    <p className="v2-section-label">Amaana Foundation</p>
    <h2 className="v2-section-title">{label}</h2>
    <div style={grid} aria-hidden="true">
      {Array.from({ length: layout === "cards" ? 3 : 2 }, (_, index) =>
        <div key={index} className="v2-appeal-card" style={{ padding: "1rem", minHeight: "8rem" }}>
          <div style={{ ...bar, height: layout === "cards" ? "4rem" : "2rem", marginBottom: ".8rem" }} />
          <div style={{ ...bar, width: "75%" }} />
        </div>)}
    </div>
  </section>;
}
