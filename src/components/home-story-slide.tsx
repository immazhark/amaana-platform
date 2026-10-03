import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function HomeBannerLogo({ priority = false }: { priority?: boolean }) {
  return <div className="v3-home-story-logo" aria-hidden="true"><span><Image src="/brand/amaana-mark.svg" width={754} height={752} alt="" sizes="(max-width: 600px) 220px, (max-width: 900px) 320px, 480px" priority={priority} /></span></div>;
}

type HomeBannerSlideProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions: readonly { href: string; label: string; secondary?: boolean }[];
  visual?: ReactNode;
  className?: string;
  priority?: boolean;
};

export function HomeBannerSlide({ eyebrow, title, description, actions, visual, className = "", priority = false }: HomeBannerSlideProps) {
  return (
    <article className={`v3-home-banner-slide page-hero--level1 ${className}`}>
      {visual ?? <HomeBannerLogo priority={priority} />}
      <div className="v3-shell v3-home-banner-content"><div className="v3-home-banner-copy">
        <p className="page-hero__eyebrow v3-home-banner-kicker">{eyebrow}</p>
        <h2 className="page-hero__title v3-home-banner-brandline">{title}</h2>
        <div className="page-hero__description"><p>{description}</p></div>
        <div className="page-hero__actions v3-home-banner-actions">
          {actions.map(action => <Link key={action.href} className={`page-hero__button${action.secondary ? " page-hero__button--secondary" : ""}`} href={action.href}>{action.label}</Link>)}
        </div>
      </div></div>
    </article>
  );
}

export function HomeStorySlide() {
  return <HomeBannerSlide className="v3-home-banner-slide--story" priority eyebrow="The Story of Amaana · Hyderabad" title="A trust that began around one family table." description="What began as a small grassroots effort to support families with dignity grew, year by year, into recurring community programmes and a formally organised charitable foundation. The purpose has remained the same: treat every contribution as an amaana — a trust." actions={[{ href: "/about", label: "Discover our story" }, { href: "/our-work", label: "Explore our work", secondary: true }]} />;
}
