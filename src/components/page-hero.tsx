import type { ReactNode } from "react";
import Link from "next/link";
import { isPrivateRoute } from "@/lib/public-routing";

export type PageHeroVariant = "level1" | "level2" | "trust" | "action" | "information" | "recognition";

type HeroAction = {
  label: string;
  href: string;
  secondary?: boolean;
};

type PageHeroProps = {
  variant: PageHeroVariant;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  actions?: readonly HeroAction[];
  visual?: ReactNode;
  visualKicker?: string;
  visualTitle?: string;
  visualNote?: string;
  id?: string;
  className?: string;
};

/** Keep dynamic editorial actions within reviewed navigation schemes. */
function isReviewedHeroHref(href: unknown): href is string {
  if (typeof href !== "string" || !href || href.length > 2048 ||
      href.trim() !== href || /[\\\s\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("#")) return /^#[A-Za-z][A-Za-z0-9_-]*$/.test(href);
  if (href.startsWith("/")) {
    const pathname = href.split(/[?#]/, 1)[0] ?? "";
    if (!/^\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)?$/.test(pathname)) return false;
    // Some public navigation destinations are deliberately omitted from
    // sitemap indexing: reviewed appeal giving and private tracking entry.
    // Never allow tracking subroutes, receipts, or private API destinations.
    return !isPrivateRoute(pathname) ||
      /^\/donate\/[a-z0-9_-]+$/.test(pathname) ||
      pathname === "/request-assistance/status";
  }
  if (/^mailto:/i.test(href)) return /^mailto:[^@?#]+@[^@/?#]+(?:\?[^#]*)?$/i.test(href);
  if (/^tel:/i.test(href)) return /^tel:\+?[0-9][0-9().-]*$/i.test(href);
  if (!/^https:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isReviewedHeroAction(value: unknown): value is HeroAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const action = value as Partial<HeroAction>;
  return typeof action.label === "string" && Boolean(action.label.trim()) &&
    (action.secondary === undefined || typeof action.secondary === "boolean") &&
    isReviewedHeroHref(action.href);
}

function HeroActionLink({ action }: { action: HeroAction }) {
  const className = action.secondary ? "page-hero__button page-hero__button--secondary" : "page-hero__button";
  const directAnchor = action.href.startsWith("#") || /^(?:mailto:|tel:|https:\/\/)/i.test(action.href);

  if (directAnchor) {
    return <a className={className} href={action.href}>{action.label}</a>;
  }

  return <Link className={className} href={action.href}>{action.label}</Link>;
}

export function PageHero({
  variant,
  eyebrow,
  title,
  description,
  actions = [],
  visual,
  visualKicker,
  visualTitle,
  visualNote,
  id,
  className = "",
}: PageHeroProps) {
  const classes = ["page-hero", "page-hero--level1", `page-hero--${variant}`, className].filter(Boolean).join(" ");
  const reviewedActions = Array.isArray(actions) ? actions.filter(isReviewedHeroAction) : [];

  return (
    <section className={classes} aria-labelledby={id || undefined} data-hero-purpose={variant}>
      <div className="amaana-backdrop-emblem" aria-hidden="true" />
      <div className="page-hero__shell">
        <div className="page-hero__grid">
          <div className="page-hero__copy">
            <p className="page-hero__eyebrow">{eyebrow}</p>
            <h1 className="page-hero__title" id={id}>{title}</h1>
            <div className="page-hero__description">{description}</div>
            {reviewedActions.length > 0 && (
              <div className="page-hero__actions">
                {reviewedActions.map(action => <HeroActionLink action={action} key={`${action.href}-${action.label}`} />)}
              </div>
            )}
          </div>

          <div className="page-hero__visual">
            {visual ?? (
              <div className="page-hero__visual-fallback" aria-hidden="true">
                <span>{visualKicker ?? eyebrow}</span>
                <strong>{visualTitle ?? "Amaana Foundation"}</strong>
                {visualNote && <small>{visualNote}</small>}
                <i />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

