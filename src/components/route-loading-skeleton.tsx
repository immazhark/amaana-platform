import type { CSSProperties } from "react";

type LoadingLayout = "cards" | "form" | "editorial";

const shape: CSSProperties = {
  borderRadius: ".4rem",
  background: "var(--af-color-blue-note)",
  border: "1px solid rgb(18 34 57 / 8%)",
};

/** Accessible shape-only client navigation fallback; never imitates financial
 * settlement, live impact metrics, beneficiary evidence or private documents. */
export function RouteLoadingSkeleton({ label, layout = "cards" }: {
  label: string;
  layout?: LoadingLayout;
}) {
  return <section role="status" aria-live="polite" aria-busy="true"
    data-loading-view={layout}
    style={{ width: "min(100%, 78rem)", margin: "auto", padding: "clamp(1rem, 3vw, 2.5rem)", color: "var(--af-color-navy-950)" }}
  >
    <p className="v2-section-label">Amaana Foundation</p>
    <h2 className="v2-section-title">{label}</h2>
    <div aria-hidden="true" style={{
      display: "grid", gap: ".8rem",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
    }}>
      {Array.from({ length: layout === "cards" ? 3 : 2 }, (_, index) =>
        <div key={index} style={{
          padding: "1rem", border: "1px solid rgb(18 34 57 / 12%)",
          borderRadius: ".8rem", background: "var(--af-color-surface)",
        }}>
          <div style={{ ...shape, height: layout === "cards" ? "5rem" : "2rem", marginBottom: ".8rem" }} />
          <div style={{ ...shape, height: ".9rem", width: "75%" }} />
        </div>,
      )}
    </div>
  </section>;
}
