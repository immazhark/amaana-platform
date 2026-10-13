"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useId, type ComponentProps } from "react";

export const NAVIGATION_STATUS_EVENT = "amaana:navigation-status";

function NavigationStatus() {
  const { pending } = useLinkStatus();
  const id = useId();
  useEffect(() => {
    if (!pending) return;
    const from = window.location.pathname;
    window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, { detail: { id, from, pending: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent(NAVIGATION_STATUS_EVENT, { detail: { id, from, pending: false } }));
    };
  }, [pending, id]);
  return null;
}

/** Keep native Next link behavior and report only its real pending lifecycle. */
export default function NavigationLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<NavigationStatus /></Link>;
}
