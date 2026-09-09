import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header">
    <nav className="container nav" aria-label="Primary navigation">
      <Link className="brand" href="/" aria-label="Amaana Foundation home"><span className="brand-mark">A</span><span>Amaana Foundation</span></Link>
      <div className="nav-links"><Link href="/appeals">Appeals</Link><Link href="/request-assistance">Request assistance</Link><Link href="/#about">About</Link><Link className="button" href="/appeals">Donate</Link></div>
    </nav>
  </header>;
}
