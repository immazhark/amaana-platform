"use client";

import { type ReactNode, useId, useState } from "react";

type FooterNavGroupProps = {
  label: string;
  children: ReactNode;
};

export function FooterNavGroup({ label, children }: FooterNavGroupProps) {
  const [open, setOpen] = useState(false);
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
        {children}
      </div>
    </div>
  );
}
