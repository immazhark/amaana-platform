"use client";

import { Children, cloneElement, isValidElement, type ReactNode, useId, useState } from "react";
import { usePathname } from "next/navigation";

type FooterNavGroupProps = {
  label: string;
  children: ReactNode;
};

export function FooterNavGroup({ label, children }: FooterNavGroupProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const id = `footer-nav-${useId().replaceAll(":", "")}`;

  return (
    <div className="footer-nav-group" data-open={open ? "true" : "false"}>
      <h3 className="footer-nav-title">
        <span className="footer-nav-label">{label}</span>
        <button
          type="button"
          className="footer-nav-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(value => !value)}
        >
          <span>{label}</span>
          <span className="footer-nav-toggle-icon" aria-hidden="true">{open ? "–" : "+"}</span>
        </button>
      </h3>
      <div className="footer-links" id={id}>
        {Children.map(children, child => {
          if (!isValidElement<{ href?: string; "aria-current"?: "page" }>(child)) return child;
          const href = child.props.href;
          const active = typeof href === "string" && (pathname === href || pathname.startsWith(`${href}/`));
          return cloneElement(child, { "aria-current": active ? "page" : undefined });
        })}
      </div>
    </div>
  );
}
