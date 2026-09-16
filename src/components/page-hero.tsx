import type { ReactNode } from "react";
import Link from "next/link";

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

function HeroActionLink({ action }: { action: HeroAction }) {
  const className = action.secondary ? "page-hero__button page-hero__button--secondary" : "page-hero__button";
  const directAnchor = action.href.startsWith("#") || action.href.startsWith("mailto:") || action.href.startsWith("tel:") || /^https?:\/\//.test(action.href);

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
  const classes = ["page-hero", `page-hero--${variant}`, className].filter(Boolean).join(" ");

  return (
    <section className={classes} aria-labelledby={id}>
      <div className="page-hero__atmosphere" aria-hidden="true" />
      <div className="page-hero__shell">
        <div className="page-hero__grid">
          <div className="page-hero__copy">
            <p className="page-hero__eyebrow">{eyebrow}</p>
            <h1 className="page-hero__title" id={id}>{title}</h1>
            <div className="page-hero__description">{description}</div>
            {actions.length > 0 && (
              <div className="page-hero__actions">
                {actions.map(action => <HeroActionLink action={action} key={`${action.href}-${action.label}`} />)}
              </div>
            )}
          </div>

          <div className="page-hero__visual" aria-label={visual ? undefined : visualTitle ?? eyebrow}>
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
