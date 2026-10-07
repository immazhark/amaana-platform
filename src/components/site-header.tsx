"use client";
import { UIIcon } from "./ui-icon";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./site-header.module.css";

const primaryLinks = [
  ["Our Work", "/our-work"],
  ["Impact", "/impact"],
  ["About", "/about"],
  ["Get Involved", "/get-involved"],
] as const;

const secondaryLinks = [
  ["Stories", "/stories"],
  ["Faith & Reflections", "/faith-and-reflections"],
  ["Request assistance", "/request-assistance"],
  ["How we work", "/how-we-verify"],
  ["Transparency", "/transparency"],
  ["Governance", "/governance"],
  ["Contact", "/contact"],
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
  const closeMenuAndRestoreFocus = () => {
    setOpenForPath(null);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const nav = mobileNavRef.current;
    const toggle = toggleRef.current;
    if (!nav || !toggle) return;
    const focusable = [toggle, ...nav.getElementsByTagName("a")];
    focusable[1]?.focus();
    const mobile = window.matchMedia("(max-width: 1020px)");
    const onBreakpoint = () => {
      if (mobile.matches) return;
      setOpenForPath(null);
      toggle.parentElement?.querySelector<HTMLElement>("a")?.focus();
    };
    mobile.addEventListener("change", onBreakpoint);
    document.body.classList.add("af-menu-lock");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenForPath(null);
        toggle.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const last = focusable.at(-1)!;
      const active = document.activeElement;
      if (event.shiftKey && active === toggle) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        toggle.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("af-menu-lock");
      window.removeEventListener("keydown", onKeyDown);
      mobile.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  return (
    <>
      <header className={`site-header ${styles.header}`}>
      <nav className="container nav" aria-label="Primary navigation">
        <Link className="brand brand-official" href="/" aria-label="Amaana Foundation home" onClick={closeMenu}>
          <Image className="brand-lockup" src="/brand/amaana-mark.svg" width={108} height={108} alt="Amaana Foundation — Upholding Trust" priority />
        </Link>

        <button ref={toggleRef} className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation menu" : "Open navigation menu"} onClick={() => setOpenForPath(current => current === pathname ? null : pathname)}>
          <UIIcon name={open ? "close" : "menu"} />
        </button>

        <div className="nav-links">
          {primaryLinks.map(([label, href]) => {
            const active = isActivePath(pathname, href);
            return <Link className={active ? "nav-link active" : "nav-link"} href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
          })}
          <Link className="button nav-donate af-support-cta" href="/appeals" aria-current={isActivePath(pathname, "/appeals") ? "page" : undefined}>Support a need</Link>
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
            {secondaryLinks.map(([label, href]) => {
              const active = isActivePath(pathname, href);
              return <Link className={active ? "active" : undefined} href={href} key={href} onClick={closeMenu} aria-current={active ? "page" : undefined}>{label}</Link>;
            })}
          </div>
          <Link className="button af-support-cta" href="/appeals" onClick={closeMenu} aria-current={isActivePath(pathname, "/appeals") ? "page" : undefined}>Support a verified need</Link>
        </div>
      </nav>
      </header>
      {open ? <button type="button" className={`mobile-menu-backdrop ${styles.backdrop}`} tabIndex={-1} aria-label="Close navigation menu" onClick={closeMenuAndRestoreFocus} /> : null}
    </>
  );
}
