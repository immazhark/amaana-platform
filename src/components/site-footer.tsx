import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-grid">
      <div><div className="brand"><span className="brand-mark">A</span><span>Amaana Foundation</span></div><p style={{marginTop: "1rem", maxWidth: "36rem"}}>Connecting verified needs with compassionate giving, with dignity and responsible stewardship.</p></div>
      <div><h3>Explore</h3><div className="footer-links"><Link href="/appeals">Current appeals</Link><Link href="/request-assistance">Request assistance</Link><Link href="/how-we-verify">How we verify</Link><Link href="/impact">Our impact</Link><Link href="/about">About</Link></div></div>
      <div><h3>Trust & policies</h3><div className="footer-links"><Link href="/compliance">Compliance</Link><Link href="/donation-policy">Donation policy</Link><Link href="/refund-policy">Refund policy</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div></div>
    </div>
    <div className="footer-note">© {new Date().getFullYear()} Amaana Foundation · Hyderabad, Telangana · <a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a><br/>Domestic donations only. Verification reduces risk but does not eliminate it.</div>
  </div></footer>;
}
