import { SectionHeading } from "@/components/section-heading";
import Link from "next/link";
import { EidGrowthExplorer } from "@/components/eid-growth-explorer";
import { ActionIcon } from "@/components/action-icon";

export function HomeGrowth({ eidProgrammePublished = true }: { eidProgrammePublished?: boolean }) {
  return (
      <section className="v3-section v3-eid dark" aria-labelledby="eid-growth-title">
        <div className="v3-shell">
          <SectionHeading eyebrow={<>Seven documented Eid drives</>} title={<>From 85 families in 2020 to 710 in 2026.</>} subtitle={<>Explore annual family reach across seven Eid Gift Kit drives, compare growth, and see cumulative distributions without treating families served in multiple years as unique recipients.</>} id="eid-growth-title" className="v3-section-head" titleClassName="v3-heading" />

          <EidGrowthExplorer />

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
