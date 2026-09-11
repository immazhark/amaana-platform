import type { Metadata } from "next";
import Link from "next/link";
import { AppealCard } from "@/components/appeal-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Appeals",
  description: "Explore current verified support appeals from Amaana Foundation.",
};

export const dynamic = "force-dynamic";

export default async function AppealsPage() {
  const appeals = await prisma.appeal.findMany({
    where: { status: { in: ["PUBLISHED", "FUNDED"] } },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
  });

  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Verified needs</p>
          <h1 className="v2-display" style={{ maxWidth: "9ch" }}>Support a need that has been reviewed.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Amaana publishes an appeal only after reviewing the information available to the team. Public pages share what is necessary to understand the need while private documents remain protected.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Current appeals</p>
              <h2 className="v2-section-title">Give where a verified appeal is active.</h2>
            </div>
            <p className="v2-section-intro">
              Donations are currently limited to India. Amaana does not accept foreign contributions because the Foundation is not FCRA-registered.
            </p>
          </div>

          {appeals.length ? (
            <div className="grid appeal-grid">
              {appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}
            </div>
          ) : (
            <div className="v2-reminder" style={{ color: "var(--v2-ink)", borderColor: "rgb(15 27 43 / 12%)", background: "#fffdf8" }}>
              <span className="v2-reminder-label" style={{ color: "var(--v2-gold)" }}>No active public appeal right now</span>
              <h3 style={{ marginTop: "1rem" }}>There is no donation checkout to push you into without a verified need.</h3>
              <p style={{ color: "#68717a" }}>
                You can still explore completed initiatives, read documented stories, understand Amaana&apos;s process, or return when a reviewed appeal is published.
              </p>
              <div className="v2-hero-actions">
                <Link className="v2-button" href="/our-work">Explore our work</Link>
                <Link className="v2-text-link" href="/stories">Read Stories of Amanah →</Link>
                <Link className="v2-text-link" href="/get-involved">Other ways to help →</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v2-section">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Before an appeal is published</p>
              <h2 className="v2-section-title">Review before fundraising.</h2>
            </div>
            <p className="v2-section-intro">
              Requests are received with supporting information, reviewed by the team and only then considered for public publication. Publication does not mean private verification material becomes public.
            </p>
          </div>
          <div className="v2-journey">
            <div className="v2-journey-step"><b>Request received</b><span>The circumstances and requested assistance are recorded.</span></div>
            <div className="v2-journey-step"><b>Information reviewed</b><span>Relevant proofs and known circumstances are checked.</span></div>
            <div className="v2-journey-step"><b>Decision</b><span>The team decides whether and how Amaana can responsibly support the need.</span></div>
            <div className="v2-journey-step"><b>Public-safe appeal</b><span>Only approved information required to explain the need is published.</span></div>
            <div className="v2-journey-step"><b>Update & closure</b><span>Known outcomes and donor updates are recorded without inventing what is not known.</span></div>
          </div>
          <div style={{ marginTop: "2rem" }}><Link className="v2-text-link" href="/how-we-verify">See how Amaana works →</Link></div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Need assistance?</p>
          <h2>Requests begin privately, not as public appeals.</h2>
          <p>If you or someone you know needs support, use the assistance request journey so the team can review the circumstances before anything is considered for publication.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/request-assistance">Request assistance</Link>
            <Link className="v2-text-link" href="/transparency">Our transparency approach →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
