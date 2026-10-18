import type { CSSProperties } from "react";

type LoadingLayout = "cards" | "form" | "editorial";

const surface: CSSProperties = {
  width: "min(100%, 78rem)",
  margin: "0 auto",
  padding: "clamp(1.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)",
  color: "var(--af-color-navy-950)",
};
const bar: CSSProperties = {
  borderRadius: ".5rem",
  background: "linear-gradient(110deg, var(--af-color-blue-note), var(--af-color-surface))",
  border: "1px solid rgb(18 34 57 / 9%)",
};
const panel: CSSProperties = {
  padding: "clamp(1rem, 2vw, 1.5rem)",
  border: "1px solid rgb(18 34 57 / 12%)",
  borderRadius: ".85rem",
  background: "var(--af-color-surface)",
  minHeight: "10rem",
  display: "grid",
  alignContent: "start",
  gap: ".9rem",
};

/**
 * Accessible App Router loading UI for public content.
 * Shape-only placeholders do not imply published counts, approved appeals,
 * payment outcomes, or private assistance records. No animation or network
 * reads: motion preferences and constrained devices are respected by default.
 */
export function RouteLoadingSkeleton({
  label,
  layout = "cards",
}: {
  label: string;
  layout?: LoadingLayout;
}) {
  const columns = layout === "form" ? 2 : layout === "editorial" ? 2 : 3;
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-loading-view={layout}
      style={surface}
    >
      <p className="v2-section-label" style={{ marginBottom: ".9rem" }}>Amaana Foundation</p>
      <h2 className="v2-section-title" style={{ margin: "0 0 1.5rem", lineHeight: 1.2 }}>
        {label}
      </h2>
      <div aria-hidden="true">
        <div style={{ ...bar, height: "1rem", maxWidth: "min(100%, 32rem)", marginBottom: ".8rem" }} />
        <div style={{ ...bar, height: ".85rem", maxWidth: "min(100%, 24rem)", marginBottom: "2rem" }} />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
          gap: "1rem",
        }}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} style={panel}>
              <div style={{ ...bar, height: layout === "cards" ? "6.5rem" : "2.25rem" }} />
              <div style={{ ...bar, height: "1.1rem", maxWidth: "85%" }} />
              <div style={{ ...bar, height: ".85rem", maxWidth: "65%" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
