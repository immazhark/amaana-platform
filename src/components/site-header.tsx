"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openForPath === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const closeMenu = () => setOpenForPath(null);

  useEffect(() => {
    if (!open) return;
    const firstLink = mobileNavRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenForPath(null);
        requestAnimationFrame(() => toggleRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const nav = mobileNavRef.current;
      const toggle = toggleRef.current;
      if (!nav || !toggle) return;
      const focusable = [toggle, ...Array.from(nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))]
        .filter(element => element.getClientRects().length > 0);
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Primary navigation">
        <Link className="brand brand-official" href="/" aria-label="Amaana Foundation home" onClick={closeMenu}>
          <Image className="brand-lockup" src="/brand/amaana-mark.svg" width={108} height={108} alt="Amaana Foundation — Upholding Trust" priority />
        </Link>

        <button ref={toggleRef} className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation menu" : "Open navigation menu"} onClick={() => setOpenForPath(current => current === pathname ? null : pathname)}>
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>

        <div className="nav-links">
          {primaryLinks.map(([label, href]) => {
            const active = isActivePath(pathname, href);
            return <Link className={active ? "nav-link active" : "nav-link"} href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
          })}
          <Link className="button nav-donate" href="/appeals">Support a need</Link>
        </div>
      </nav>

      <nav ref={mobileNavRef} id="mobile-navigation" className={`mobile-menu${open ? " open" : ""}`} aria-label="Mobile navigation" hidden={!open}>
        <div className="container mobile-menu-inner">
          <div className="mobile-menu-primary">
            {primaryLinks.map(([label, href]) => {
              const active = isActivePath(pathname, href);
              return <Link className={active ? "active" : undefined} href={href} key={href} onClick={closeMenu} aria-current={active ? "page" : undefined}>{label}</Link>;
            })}
          </div>
          <div className="mobile-menu-secondary">
            <Link href="/request-assistance" onClick={closeMenu}>Request assistance</Link>
            <Link href="/how-we-verify" onClick={closeMenu}>How we work</Link>
            <Link href="/transparency" onClick={closeMenu}>Transparency</Link>
            <Link href="/governance" onClick={closeMenu}>Governance</Link>
            <Link href="/contact" onClick={closeMenu}>Contact</Link>
          </div>
          <Link className="button" href="/appeals" onClick={closeMenu}>Support a verified need</Link>
        </div>
      </nav>
    </header>
  );
}
