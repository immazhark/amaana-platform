import Link from "next/link";

export function HomeStorySlide() {
  return (
<article className="v3-home-banner-slide v3-home-banner-slide--story">
            <div className="v3-home-banner-shade" aria-hidden="true" />
            <div className="v3-shell v3-home-banner-content">
              <p className="v3-home-banner-kicker">The Story of Amaana · Hyderabad</p>
              <span className="v3-home-banner-brandline">A trust that began around one family table.</span>
              <h2>From a Ramadan effort in 2020 to Amaana Foundation today.</h2>
              <p>What began as a small grassroots effort to support families with dignity grew, year by year, into recurring community programmes and a formally organised charitable foundation. The purpose has remained the same: treat every contribution as an amaana — a trust.</p>
              <div className="v3-home-banner-actions">
                <Link className="v3-btn" href="/about">Discover our story</Link>
                <Link className="v3-btn secondary" href="/our-work">Explore our work</Link>
              </div>
            </div>
          </article>
  );
}
