import type { ReactNode } from "react";
import styles from "./section-heading.module.css";

type SectionHeadingProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  id?: string;
  className?: string;
  titleClassName?: string;
};

/** A body-section introduction; content panels and carousel controls stay outside. */
export function SectionHeading({ eyebrow, title, subtitle, id, className = "", titleClassName = "" }: SectionHeadingProps) {
  return <div className={`v2-section-head af-section-heading ${styles.heading} ${className}`} data-section-heading="split">
    <div><p className="v2-section-label">{eyebrow}</p><h2 className={`v2-section-title ${titleClassName}`} id={id}>{title}</h2></div>
    <p className="v2-section-intro">{subtitle}</p>
  </div>;
}
