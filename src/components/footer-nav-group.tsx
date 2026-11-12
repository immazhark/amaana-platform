"use client";

import { Children, cloneElement, isValidElement, type ReactNode, useId, useState } from "react";
import { usePathname } from "next/navigation";

type FooterNavGroupProps = {
  label: string;
  children: ReactNode;
};

export function FooterNavGroup({ label, children }: FooterNavGroupProps) {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const [observedPath, setObservedPath] = useState(pathname);
  // Shared App Router footers persist across routes; retire a previous open group.
  if (observedPath !== pathname) {
    setObservedPath(pathname);
    setOpenForPath(null);
  }
  const open = observedPath === pathname && openForPath === pathname;
  const id = `footer-nav-${useId().replaceAll(":", "")}`;
  const links = Children.map(children, child => {
    if (!isValidElement<{ href?: string; "aria-current"?: "page" }>(child)) return child;
    const href = child.props.href;
    const active = typeof href === "string" && pathname === href;
    return cloneElement(child, { "aria-current": active ? "page" : undefined });
  });

  return (
    <div className="footer-nav-group" data-open={open ? "true" : "false"}>
      <h3 className="footer-nav-title">
        <span className="footer-nav-label">{label}</span>
        <button
          type="button"
          className="footer-nav-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpenForPath(current => current === pathname ? null : pathname)}
        >
          <span>{label}</span>
          <span className="footer-nav-toggle-icon" aria-hidden="true">{open ? "–" : "+"}</span>
        </button>
      </h3>
      <div className="footer-links" id={id}>{links}</div>
      <noscript><div className="footer-links footer-nav-noscript-links">{links}</div></noscript>
    </div>
  );
}
