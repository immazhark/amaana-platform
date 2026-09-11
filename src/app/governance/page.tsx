import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Governance",
  description: "Verified governance and registration information for Amaana Foundation, with clear boundaries between legal governance, public operations and platform administration.",
  alternates: { canonical: "/governance" },
  openGraph: {
    type: "website",
    url: "/governance",
    title: "Governance | Amaana Foundation",
    description: "Verified governance and registration information for Amaana Foundation in Hyderabad.",
  },
  twitter: {
    card: "summary",
    title: "Governance | Amaana Foundation",
    description: "Amaana Foundation's verified governance and public registration record.",
  },
};

const trustees = ["Mohammed Ather Khan", "Mohammed Mazhar Khan", "Syed Iqba Ali"] as const;

export default function GovernancePage() {
  return (
    <div className="v2-home v2-governance-page">
      <section className="v2-governance-hero">
        <div className="v2-shell v2-governance-hero-grid">
          <div>
            <p className="v2-section-label">Governance · public record</p>
            <h1>Trust should have<br /><em>structure.</em></h1>
            <p>
              Amaana&apos;s public governance information is presented from verified registration material. Legal office-bearer roles are kept separate from internal website administration and day-to-day software permissions.
            </p>
          </div>
          <aside className="v2-governance-record" aria-label="Registration snapshot">
            <span>Registration snapshot</span>
            <dl>
              <div><dt>Entity</dt><dd>Amaana Foundation</dd></div>
              <div><dt>Type</dt><dd>Trust</dd></div>
              <div><dt>Registration date</dt><dd>23 February 2024</dd></div>
              <div><dt>DARPAN ID</dt><dd>TS/2024/0403215</dd></div>
              <div><dt>DARPAN registration</dt><dd>21 May 2024</dd></div>
              <div><dt>City / State</dt><dd>Hyderabad, Telangana</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div>
              <p className="v2-section-label">Legal governance</p>
              <h2 className="v2-section-title">The registered office bearers.</h2>
            </div>
            <p className="v2-section-intro">
              The Government of India NGO DARPAN record identifies the following three office bearers, each with the designation Trustee.
            </p>
          </div>
          <div className="v2-governance-people">
            {trustees.map((name, index) => (
              <article key={name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><small>Trustee</small><h3>{name}</h3></div>
              </article>
            ))}
          </div>
          <p className="v2-governance-source-note">
            This page intentionally does not publish private addresses, identity numbers, signatures or unredacted source documents.
          </p>
        </div>
      </section>

      <section className="v2-governance-boundaries">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Clear role boundaries</p><h2 className="v2-section-title">Governance is not the same as platform access.</h2></div>
            <p className="v2-section-intro">A website can have administrators, reviewers and content approvers without those software permissions changing the legal governance of the organization.</p>
          </div>
          <div className="v2-governance-boundary-grid">
            <article><span>01</span><h3>Legal governance</h3><p>Registered trustees and statutory organization records belong here.</p></article>
            <article><span>02</span><h3>Public operations</h3><p>Contact, programmes and verified public-facing responsibilities may be documented separately when source material supports them.</p></article>
            <article><span>03</span><h3>Platform administration</h3><p>Internal software permissions remain an operational security matter and are not presented as legal titles.</p></article>
          </div>
        </div>
      </section>

      <section className="v2-section v2-governance-registration">
        <div className="v2-shell v2-governance-registration-grid">
          <div>
            <p className="v2-section-label">Registration record</p>
            <h2>Public facts, without publishing sensitive paperwork.</h2>
            <p>The DARPAN record lists Amaana Foundation as a Trust registered in Hyderabad, Telangana, with registration number BK-4, CS No 59/2024 under the Registration Act 1908.</p>
          </div>
          <div className="v2-governance-facts">
            <div><small>Registration no.</small><strong>BK-4, CS No 59/2024</strong></div>
            <div><small>Registered with</small><strong>Sub-Registrar</strong></div>
            <div><small>Act</small><strong>Registration Act 1908</strong></div>
            <div><small>DARPAN</small><strong>TS/2024/0403215</strong></div>
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-governance-compliance-link">
        <div className="v2-shell v2-faith-grid">
          <div>
            <p className="v2-section-label">Tax and donation disclosures</p>
            <h2 className="v2-section-title">Governance and tax status are different records.</h2>
            <p className="v2-section-intro">Amaana&apos;s provisional Section 80G position, domestic-only contribution boundary and unresolved 12AB/12A confirmation are maintained on the compliance page so they are not blurred into governance claims.</p>
          </div>
          <div className="v2-reminder">
            <span className="v2-reminder-label">Current publication rule</span>
            <blockquote>State only what the record supports.</blockquote>
            <p>No permanent 80G status, FCRA registration or unverified office-bearer title is implied here.</p>
          </div>
        </div>
      </section>

      <section className="v2-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Continue through the trust record</p>
          <h2>Structure, evidence and accountability belong together.</h2>
          <div className="v2-hero-actions v2-actions-center">
            <Link className="v2-button" href="/compliance">Registration & compliance</Link>
            <Link className="v2-text-link" href="/transparency">Transparency →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
