import { SocialIcon, type SocialNetwork } from "@/components/social-icon";
import Image from "next/image";
import Link from "next/link";
import { FooterNavGroup } from "@/components/footer-nav-group";

const socialLinks: ReadonlyArray<{ network: SocialNetwork; label: string; href: string | null }> = [
  { network: "instagram", label: "Instagram", href: "https://www.instagram.com/amaanafoundation/" },
  { network: "facebook", label: "Facebook", href: "https://www.facebook.com/amaanafoundation24/" },
  { network: "youtube", label: "YouTube", href: "https://www.youtube.com/@amaanafoundation" },
  { network: "threads", label: "Threads", href: "https://www.threads.net/@amaanafoundation" },
  { network: "linkedin", label: "LinkedIn", href: null },
];


export function SiteFooter() {
  const activeSocialLinks = socialLinks.filter((item): item is typeof item & { href: string } => Boolean(item.href));
  return (
    <footer className="site-footer">
      <div className="amaana-backdrop-emblem" aria-hidden="true" />
      <div className="container">
        <div className="footer-lead">
          <div className="footer-lead-copy">
            <p className="footer-kicker">Verified need. Responsible support. Dignified impact.</p>
            <h2>Upholding Trust. Serving With Compassion, Dignity and Accountability.</h2>
          </div>
          <div className="footer-lead-actions">
            <Link href="/our-work">Explore our work <span aria-hidden="true">→</span></Link>
            <Link href="/appeals">Support a verified need <span aria-hidden="true">→</span></Link>
          </div>
        </div>

        <div className="footer-grid footer-grid-v2">
          <div className="footer-intro">
            <Link className="footer-brand-lockup" href="/" aria-label="Amaana Foundation home">
              <span className="footer-brand-mark" aria-hidden="true"><Image src="/brand/amaana-mark.svg" alt="" width={88} height={88} /></span>
              <span className="footer-brand-copy"><strong>AMAANA</strong><small>FOUNDATION</small></span>
            </Link>
            <p>A Hyderabad-based registered charitable trust supporting verified community needs through recurring initiatives, case-led assistance, education and relief.</p>
            <nav className="footer-socials" aria-label="Amaana Foundation social channels">
              {activeSocialLinks.map(item => (
                <a href={item.href} key={item.network} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} — opens in a new tab`}>
                  <span className="footer-social-icon"><SocialIcon network={item.network} /></span><span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <FooterNavGroup label="Explore">
            <Link href="/our-work">Our Work</Link><Link href="/impact">Impact</Link><Link href="/stories">Stories of Amanah</Link><Link href="/faith-and-reflections">Faith & Reflections</Link><Link href="/about">Our Story</Link>
          </FooterNavGroup>
          <FooterNavGroup label="Take part">
            <Link href="/appeals">Current Appeals</Link><Link href="/get-involved">Get Involved</Link><Link href="/donate">Donate</Link><Link href="/get-involved/sponsor-education">Sponsor Education</Link><Link href="/partner">Partner With Amaana</Link><Link href="/request-assistance">Request Assistance</Link><Link href="/how-we-verify">How Amaana Works</Link><Link href="/contact">Contact</Link>
          </FooterNavGroup>
          <FooterNavGroup label="Trust & policies">
            <Link href="/transparency">Transparency</Link><Link href="/governance">Governance</Link><Link href="/recognition">Awards & Recognition</Link><Link href="/compliance">Registration & Compliance</Link><Link href="/donation-policy">Donation Policy</Link><Link href="/refund-policy">Refund Policy</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
          </FooterNavGroup>
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
