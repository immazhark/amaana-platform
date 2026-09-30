import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/home-documentary.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home Hero Browser Acceptance Fixture",
  robots: { index: false, follow: false },
};

export default function HomeHeroBrowserAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="fixture-home-title">
        <div className="v3-home-banner-carousel">
          <article className="v3-home-banner-slide v3-home-banner-slide--story">
            <div className="v3-home-banner-shade" aria-hidden="true" />
            <div className="v3-shell v3-home-banner-content">
              <p className="v3-home-banner-kicker">The Story of Amaana · Hyderabad</p>
              <span className="v3-home-banner-brandline" id="fixture-home-title">A trust that began around one family table.</span>
              <h2>From a Ramadan effort in 2020 to Amaana Foundation today.</h2>
              <p>What began as a small grassroots effort to support families with dignity grew into recurring community programmes.</p>
              <div className="v3-home-banner-actions">
                <Link className="v3-btn" href="/about">Discover our story</Link>
                <Link className="v3-btn secondary" href="/our-work">Explore our work</Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
