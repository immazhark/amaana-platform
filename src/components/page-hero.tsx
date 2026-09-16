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
                {actions.map(action => (
                  <Link
                    className={action.secondary ? "page-hero__button page-hero__button--secondary" : "page-hero__button"}
                    href={action.href}
                    key={`${action.href}-${action.label}`}
                  >
                    {action.label}
                  </Link>
                ))}
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
