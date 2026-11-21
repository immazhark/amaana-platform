import type { ReactNode } from "react";

/** The copy icon used by the checkout forms. The share icons live in appeal-share-icons so a checkout chunk does not carry them. */
type IconProps = { className?: string };
export const Icon = ({ className, children }: IconProps & { children: ReactNode }) => <svg className={className} aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
export const CopyIcon = (p: IconProps) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>;
