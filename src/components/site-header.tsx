"use client";

import Link from "next/link";
import { useState } from "react";

const primaryLinks = [
  ["Our Work", "/our-work"],
  ["Impact", "/impact"],
  ["Stories", "/stories"],
  ["Faith & Reflections", "/faith-and-reflections"],
  ["About", "/about"],
  ["Get Involved", "/get-involved"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Primary navigation">
        <Link className="brand brand-wordmark" href="/" aria-label="Amaana Foundation home" onClick={closeMenu}>
          Amaana Foundation
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
          {primaryLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          <Link className="button" href="/appeals">Donate</Link>
        </div>
      </nav>

      <div id="mobile-navigation" className={`mobile-menu${open ? " open" : ""}`}>
        <div className="container mobile-menu-inner">
          {primaryLinks.map(([label, href]) => <Link href={href} key={href} onClick={closeMenu}>{label}</Link>)}
          <Link href="/request-assistance" onClick={closeMenu}>Request assistance</Link>
          <Link href="/how-we-verify" onClick={closeMenu}>How we work</Link>
          <Link href="/compliance" onClick={closeMenu}>Transparency</Link>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>
          <Link className="button" href="/appeals" onClick={closeMenu}>Donate</Link>
        </div>
      </div>
    </header>
  );
}
