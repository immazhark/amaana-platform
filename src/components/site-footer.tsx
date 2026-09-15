import Image from "next/image";
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
          <p className="footer-kicker">Verified need. Responsible support. Dignified impact.</p>
          <h2>Upholding Trust. Serving With Compassion, Dignity and Accountability.</h2>
          <div className="footer-lead-actions">
            <Link href="/our-work">Explore our work →</Link>
            <Link href="/appeals">Support a verified need →</Link>
          </div>
        </div>

        <div className="footer-grid footer-grid-v2">
          <div className="footer-intro">
            <Link className="footer-brand-lockup" href="/" aria-label="Amaana Foundation home">
              <span className="footer-brand-mark" aria-hidden="true">
                <Image src="/brand/amaana-mark.svg" alt="" width={88} height={88} />
              </span>
              <span className="footer-brand-copy">
                <strong>AMAANA</strong>
                <small>FOUNDATION</small>
              </span>
            </Link>
            <p>
              A Hyderabad-based registered charitable trust supporting verified community needs through recurring initiatives, case-led assistance, education and relief.
            </p>
            <div className="footer-socials" aria-label="Amaana Foundation social channels">
              {socialLinks.map(([label, href]) => (
                <a href={href} key={label} target="_blank" rel="noopener noreferrer" aria-label={`${label} — opens in a new tab`}>{label} ↗</a>
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
              <Link href="/get-involved">Get Involved</Link><Link href="/donate">Donate</Link><Link href="/our-work/taleem">Taleem</Link><Link href="/recognition">Awards & Recognition</Link><Link href="/partner">Partner</Link>
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
