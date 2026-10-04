import Link from "next/link";
import { SectionHeading } from "./section-heading";

/** Keep programme closing actions on the same body-heading grid as public pages. */
export function ProgrammeNext() {
  return (
    <section className="campaign-next">
      <div className="v2-shell">
        <SectionHeading
          eyebrow="Take the next step"
          title="Choose How You Want to Help"
          subtitle={
            <span className="v2-hero-actions">
              <Link className="v2-button" href="/donate">Support Amaana</Link>
              <Link className="v2-text-link" href="/our-work">Explore Our Work →</Link>
            </span>
          }
        />
      </div>
    </section>
  );
}
