"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primaryLinks = [
  ["Our Work", "/our-work"],
  ["Impact", "/impact"],
  ["Stories", "/stories"],
  ["Faith & Reflections", "/faith-and-reflections"],
  ["About", "/about"],
  ["Get Involved", "/get-involved"],
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Primary navigation">
        <Link className="brand brand-wordmark" href="/" aria-label="Amaana Foundation home" onClick={closeMenu}>
          <span className="brand-name">Amaana Foundation</span>
          <span className="brand-location">Hyderabad</span>
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
          {primaryLinks.map(([label, href]) => {
            const active = isActivePath(pathname, href);
            return (
              <Link className={active ? "nav-link active" : "nav-link"} href={href} key={href} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
          <Link className="button nav-donate" href="/appeals">Support a need</Link>
        </div>
      </nav>

      <div id="mobile-navigation" className={`mobile-menu${open ? " open" : ""}`}>
        <div className="container mobile-menu-inner">
          <div className="mobile-menu-primary">
            {primaryLinks.map(([label, href]) => {
              const active = isActivePath(pathname, href);
              return (
                <Link className={active ? "active" : undefined} href={href} key={href} onClick={closeMenu} aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="mobile-menu-secondary" aria-label="More ways to connect">
            <Link href="/request-assistance" onClick={closeMenu}>Request assistance</Link>
            <Link href="/how-we-verify" onClick={closeMenu}>How we work</Link>
            <Link href="/transparency" onClick={closeMenu}>Transparency</Link>
            <Link href="/governance" onClick={closeMenu}>Governance</Link>
            <Link href="/contact" onClick={closeMenu}>Contact</Link>
          </div>
          <Link className="button" href="/appeals" onClick={closeMenu}>Support a verified need</Link>
        </div>
      </div>
    </header>
  );
}
