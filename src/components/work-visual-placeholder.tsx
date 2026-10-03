import styles from "./work-visual-placeholder.module.css";
import Image from "next/image";

export function WorkVisualPlaceholder({ label = "Amaana Foundation", className = "", theme = /taleem|learn|education/i.test(label) ? "education" : /eid|ramadan|qurbani|dates|winter/i.test(label) ? "seasonal" : "brand" }: { label?: string; className?: string; theme?: "brand" | "education" | "seasonal" }) {
  return (
    <div className={`work-visual-placeholder ${styles.visual}${className ? ` ${className}` : ""}`} aria-hidden="true" data-theme={theme}>
      <span className="work-visual-placeholder-mark"><Image src="/brand/amaana-mark.svg" width={80} height={80} alt="" /></span>
      <span className="work-visual-placeholder-label">{label}</span>
    </div>
  );
}
