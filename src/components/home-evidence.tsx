import { SectionHeading } from "@/components/section-heading";
import Link from "next/link";
import { eidGrowth } from "@/content/amaana";
import { ActionIcon } from "@/components/action-icon";

export function HomeGrowth({ eidProgrammePublished = true }: { eidProgrammePublished?: boolean }) {
  return (
      <section className="v3-section v3-eid dark" aria-labelledby="eid-growth-title">
        <div className="v3-shell">
          <SectionHeading eyebrow={<>Seven documented distributions</>} title={<>85 families became 710 — one year at a time.</>} subtitle={<>The year-by-year record shows the scale of the Eid Gift Kits programme more clearly than another retelling of its origin: steady continuity, documented across seven Ramadan distributions.</>} id="eid-growth-title" className="v3-section-head" titleClassName="v3-heading" />

          <div className="v3-timeline" aria-label="Eid Gift Kits growth from 2020 to 2026">
            {eidGrowth.map(item => (
              <div className="v3-year" key={item.year}>
                <strong>{item.year}</strong>
                <span>{item.families}</span>
                <small>families</small>
              </div>
            ))}
          </div>

          <div className="v3-actions">
            <Link className="v3-btn" href={eidProgrammePublished ? "/our-work/eid-gift-kits" : "/our-work"}>
              {eidProgrammePublished ? "Explore the seven-year story" : "Explore published programmes"}
            </Link>
          </div>
        </div>
      </section>

  );
}

export function HomeTrust({ hasOpenAppeals = false }: { hasOpenAppeals?: boolean }) {
  return (
      <section className="v3-section v3-trust dark" aria-labelledby="trust-title">
        <div className="v3-shell v3-trust-grid">
          <div className="v3-trust-panel">
            <p className="v3-label">Trust is part of the work</p>
            <h2 id="trust-title">Compassion With Accountability</h2>
            <p>Good intentions matter. So does what happens next. Amaana Foundation works close to the communities it serves, reviews needs before mobilising support, protects sensitive beneficiary information, and reports documented outcomes wherever records permit. Our responsibility is not only to collect support, but to ensure that it is directed toward the purpose for which it was entrusted.</p>
            <div className="v3-actions">
              <Link className="v3-btn" href="/transparency">Explore transparency</Link>
              <Link className="v3-btn secondary" href="/how-we-verify">How Amaana works</Link>
            </div>
          </div>

          <div>
            <p className="v3-label">Take the next step</p>
            <div className="v3-quick-links">
              <Link href="/our-work"><ActionIcon kind="work" /><span>Explore our work</span><ActionIcon /></Link>
              <Link href={hasOpenAppeals ? "/appeals" : "/get-involved"}><ActionIcon kind="support" /><span>{hasOpenAppeals ? "Support a verified need" : "Ways to support Amaana"}</span><ActionIcon /></Link>
              <Link href="/request-assistance"><ActionIcon kind="assistance" /><span>Request assistance privately</span><ActionIcon /></Link>
              <Link href="/get-involved"><ActionIcon kind="volunteer" /><span>Volunteer time or skills</span><ActionIcon /></Link>
              <Link href="/contact"><ActionIcon kind="contact" /><span>Contact Amaana</span><ActionIcon /></Link>
            </div>
          </div>
        </div>
      </section>

  );
}
