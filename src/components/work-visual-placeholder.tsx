export function WorkVisualPlaceholder({ label = "Amaana Foundation", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`work-visual-placeholder${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span className="work-visual-placeholder-mark">AF</span>
      <span className="work-visual-placeholder-label">{label}</span>
    </div>
  );
}
