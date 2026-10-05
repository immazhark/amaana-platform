import Link from "next/link";
import { ActionIcon, type ActionIconKind } from "./action-icon";
import styles from "./participation-card.module.css";

export type ParticipationPath = { marker: string; icon?: ActionIconKind; title: string; copy: string; action: string; href: string };
export function ParticipationCards({ paths }: { paths: readonly ParticipationPath[] }) {
  return <div className={`v2-intent-grid ${styles.grid}`}>{paths.map(path => {
    const content = <><span className={styles.marker} aria-hidden="true">{path.icon ? <ActionIcon kind={path.icon} /> : path.marker}</span><div className={styles.copy}><h3>{path.title}</h3><p>{path.copy}</p></div><span className={styles.action}>{path.action}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg></span></>;
    const className = `v2-intent-card ${styles.card}`;
    const ariaLabel = `${path.title}: ${path.action}`;
    if (/^https:\/\//i.test(path.href)) return <a className={className} data-contact-kind={path.marker} href={path.href} key={path.marker} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">{content}</a>;
    return <Link className={className} data-contact-kind={path.marker} href={path.href} key={path.marker} aria-label={ariaLabel}>{content}</Link>;
  })}</div>;
}
