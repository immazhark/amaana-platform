"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return <header className="site-header">
    <nav className="container nav" aria-label="Primary navigation">
      <Link className="brand" href="/" aria-label="Amaana Foundation home" onClick={closeMenu}>
        <span className="brand-mark" aria-hidden="true">A</span>
        <span>Amaana Foundation</span>
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen(value => !value)}
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>

      <div className="nav-links">
        <Link href="/appeals">Appeals</Link>
        <Link href="/how-we-verify">How we verify</Link>
        <Link href="/request-assistance">Request assistance</Link>
        <Link href="/about">About</Link>
        <Link className="button" href="/appeals">Donate</Link>
      </div>
    </nav>

    <div id="mobile-navigation" className={`mobile-menu${open ? " open" : ""}`}>
      <div className="container mobile-menu-inner">
        <Link href="/appeals" onClick={closeMenu}>Appeals</Link>
        <Link href="/how-we-verify" onClick={closeMenu}>How we verify</Link>
        <Link href="/request-assistance" onClick={closeMenu}>Request assistance</Link>
        <Link href="/about" onClick={closeMenu}>About</Link>
        <Link className="button" href="/appeals" onClick={closeMenu}>Donate</Link>
      </div>
    </div>
  </header>;
}
