import styles from "./body-card.module.css";
import type { ReactNode } from "react";
import { ScrollCarousel } from "./scroll-carousel";
import { WorkVisualPlaceholder } from "./work-visual-placeholder";

export type BodyCarouselVariant = "home-showcase" | "timeline-impact" | "content-deck";
export interface BodyCarouselProps {
  label: string;
  heading?: ReactNode;
  children: ReactNode;
  variant?: BodyCarouselVariant;
  autoAdvanceMs?: number;
  className?: string;
}
export function BodyCarousel({variant = "content-deck", ...props}: BodyCarouselProps) {
  return <ScrollCarousel {...props} mode="cards" className={`${props.className ?? ""} body-carousel--${variant}`} />;
}
export function BodyCard({title, visual, children, meta}: {title: string; visual?: ReactNode; children?: ReactNode; meta?: ReactNode}) {
  return <article className={`campaign-pathway-card ${styles.card}`}><div className="canonical-pathway-visual">{visual ?? <WorkVisualPlaceholder label={title}/>}</div>{meta ? <p className="v2-section-label">{meta}</p> : null}<h3>{title}</h3>{children}</article>;
}
