import Link from "next/link";

const socialLinks = [
  ["Instagram", "https://www.instagram.com/amaanafoundation/"],
  ["Facebook", "https://www.facebook.com/amaanafoundation24/"],
  ["YouTube", "https://www.youtube.com/@amaanafoundation"],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-lead">
          <p className="footer-kicker">Faith. Dignity. Action.</p>
          <h2>Follow the work. Understand the evidence. Take the next right step.</h2>
          <div className="footer-lead-actions">
            <Link href="/our-work">Explore our work →</Link>
            <Link href="/appeals">Support a verified need →</Link>
          </div>
        </div>

        <div className="footer-grid footer-grid-v2">
          <div className="footer-intro">
            <Link className="brand brand-wordmark footer-wordmark" href="/">Amaana Foundation</Link>
            <p>
              Faith-inspired service rooted in dignity, compassion and responsible stewardship — documenting real work, known outcomes and the journey behind every act of care.
            </p>
            <div className="footer-socials" aria-label="Amaana Foundation social channels">
              {socialLinks.map(([label, href]) => (
                <a href={href} key={label} target="_blank" rel="noreferrer">{label} ↗</a>
              ))}
            </div>
          </div>

          <div>
            <h3>Explore</h3>
            <div className="footer-links">
              <Link href="/our-work">Our Work</Link>
              <Link href="/impact">Impact</Link>
              <Link href="/stories">Stories of Amanah</Link>
              <Link href="/faith-and-reflections">Faith & Reflections</Link>
              <Link href="/about">Our Story</Link>
            </div>
          </div>

          <div>
            <h3>Take part</h3>
            <div className="footer-links">
              <Link href="/appeals">Current Appeals</Link>
              <Link href="/get-involved">Get Involved</Link>
              <Link href="/request-assistance">Request Assistance</Link>
              <Link href="/how-we-verify">How Amaana Works</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h3>Trust & policies</h3>
            <div className="footer-links">
              <Link href="/transparency">Transparency</Link>
              <Link href="/governance">Governance</Link>
              <Link href="/compliance">Registration & Compliance</Link>
              <Link href="/donation-policy">Donation Policy</Link>
              <Link href="/refund-policy">Refund Policy</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>

        <div className="footer-note">
          <span>© {new Date().getFullYear()} Amaana Foundation · Hyderabad, Telangana</span>
          <span><a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a></span>
          <span>Domestic donations only. Public appeals and outcomes are shared subject to verification, consent and privacy safeguards.</span>
        </div>
      </div>
    </footer>
  );
}
