import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-grid">
      <div><div className="brand"><span className="brand-mark">A</span><span>Amaana Foundation</span></div><p style={{marginTop: "1rem", maxWidth: "36rem"}}>Connecting verified needs with compassionate giving, with dignity and responsible stewardship.</p></div>
      <div><h3>Explore</h3><div className="footer-links"><Link href="/appeals">Current appeals</Link><Link href="/request-assistance">Request assistance</Link><Link href="/#how-it-works">How it works</Link></div></div>
      <div><h3>Contact</h3><div className="footer-links"><a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a><span>Hyderabad, Telangana</span></div></div>
    </div>
    <div className="footer-note">© {new Date().getFullYear()} Amaana Foundation. Domestic donations only. Verification reduces risk but does not eliminate it.</div>
  </div></footer>;
}
