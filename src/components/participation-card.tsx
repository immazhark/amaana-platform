import Link from "next/link";
import { ActionIcon, type ActionIconKind } from "./action-icon";
import styles from "./participation-card.module.css";
import { isPrivateRoute } from "@/lib/public-routing";

export type ParticipationPath = { marker: string; icon?: ActionIconKind; title: string; copy: string; action: string; href: string };
/** Only reviewed in-site routes and explicit secure contact destinations may navigate. */
function isSafeParticipationHref(href: unknown): href is string {
  if (typeof href !== "string" || !href || href.length > 2048 || href !== href.trim() || /[\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/")) return /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(href) && !isPrivateRoute(href);
  if (/^(?:mailto:|tel:)/i.test(href)) return href.length > href.indexOf(":") + 1;
  if (!/^https:\/\//i.test(href)) return false;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

const supportedIcons = new Set<ActionIconKind>([
  "arrow", "work", "support", "assistance", "volunteer", "contact", "phone", "message",
]);

export function ParticipationCards({ paths }: { paths: readonly ParticipationPath[] }) {
  if (!Array.isArray(paths)) return null;
  const reviewed = paths.filter(path =>
    path != null && typeof path === "object" && !Array.isArray(path) &&
    [path.marker, path.title, path.copy, path.action].every(field => typeof field === "string") &&
    (path.icon == null || supportedIcons.has(path.icon)) &&
    isSafeParticipationHref(path.href),
  );
  return <div className={`v2-intent-grid ${styles.grid}`}>{reviewed.map(path => {
    const content = <><span className={styles.marker} aria-hidden="true">{path.icon ? <ActionIcon kind={path.icon} /> : path.marker}</span><div className={styles.copy}><h3>{path.title}</h3><p>{path.copy}</p></div><span className={styles.action}>{path.action}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg></span></>;
    const className = `v2-intent-card ${styles.card}`;
    const ariaLabel = `${path.action}: ${path.title}${/^https:\/\//i.test(path.href) ? " (opens in a new tab)" : ""}`;
    const external = /^https:\/\//i.test(path.href);
    const protocolAction = /^(?:mailto:|tel:)/i.test(path.href);
    if (external) return <a className={className} data-contact-kind={path.marker} href={path.href} key={path.marker} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">{content}</a>;
    if (protocolAction) return <a className={className} data-contact-kind={path.marker} href={path.href} key={path.marker} aria-label={ariaLabel}>{content}</a>;
    return <Link className={className} data-contact-kind={path.marker} href={path.href} key={path.marker} aria-label={ariaLabel}>{content}</Link>;
  })}</div>;
}
