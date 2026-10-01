export function WorkVisualPlaceholder({ label = "Amaana Foundation", className = "", theme = /taleem|learn|education/i.test(label) ? "education" : /eid|ramadan|qurbani|dates|winter/i.test(label) ? "seasonal" : "brand" }: { label?: string; className?: string; theme?: "brand" | "education" | "seasonal" }) {
  return (
    <div className={`work-visual-placeholder${className ? ` ${className}` : ""}`} aria-hidden="true" style={{background:theme === "education" ? "linear-gradient(145deg,#122239,#466faa)" : theme === "seasonal" ? "linear-gradient(145deg,#122239,#466faa 55%,#c69b12)" : undefined}}>
      <svg viewBox="0 0 480 270" aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.2}} fill="none">
        <circle cx="390" cy="40" r="145" stroke="currentColor" strokeWidth="1" />
        <circle cx="390" cy="40" r="105" stroke="currentColor" strokeWidth="1" />
        <path d="M0 210L170 40L340 210L480 70M0 250L170 80L340 250L480 110" stroke="currentColor" strokeWidth="1" />
        <path d="M315 150h70v55h-70zM350 115v90M330 135h40" stroke="currentColor" strokeWidth="3" />
      </svg>
      <span className="work-visual-placeholder-mark" style={{position:"relative"}}>AF</span>
      <span className="work-visual-placeholder-label">{label}</span>
    </div>
  );
}
