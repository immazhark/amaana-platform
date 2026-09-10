import Link from "next/link";

export const metadata = {
  title: "Get Involved",
  description: "Ways to support, follow and participate in Amaana Foundation's work.",
};

export default function GetInvolvedPage() {
  return (
    <div className="v2-home">
      <section className="v2-section dark">
        <div className="v2-shell">
          <p className="v2-section-label">Get involved</p>
          <h1 className="v2-display" style={{ maxWidth: "9ch" }}>There is more than one way to stand with good work.</h1>
          <p className="v2-hero-copy" style={{ marginTop: "2rem" }}>
            Support an active verified appeal, follow Amaana's ongoing work, share a genuine need, or connect with the team about volunteering and collaboration.
          </p>
        </div>
      </section>

      <section className="v2-section paper">
        <div className="v2-shell">
          <div className="v2-work-grid">
            <Link className="v2-work-card" href="/appeals">
              <small>Support</small>
              <div><span className="v2-metric">01</span><h3>Give when a verified need is active.</h3><p>Explore current appeals and approved giving opportunities without manufactured urgency.</p></div>
            </Link>
            <Link className="v2-work-card" href="/request-assistance">
              <small>Request help</small>
              <div><span className="v2-metric">02</span><h3>Tell us about a genuine need.</h3><p>Submit accurate information through the private assistance-request workflow for review.</p></div>
            </Link>
            <Link className="v2-work-card" href="/contact">
              <small>Connect</small>
              <div><span className="v2-metric">03</span><h3>Volunteer or collaborate.</h3><p>Contact Amaana about genuine opportunities to contribute time, skills, resources or partnership support.</p></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
