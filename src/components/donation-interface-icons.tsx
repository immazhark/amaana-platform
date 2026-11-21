import type { ReactNode } from "react";

/** Small, decorative action icons; the containing control supplies the name. */
type IconProps = { className?: string };
// One shared wrapper: this module is bundled into several route chunks, so repeating the attributes cost bytes each time.
const Icon = ({ className, children }: IconProps & { children: ReactNode }) => <svg className={className} aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
export const CopyIcon = (p: IconProps) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>;
export const ShareIcon = (p: IconProps) => <Icon {...p}><path d="M12 16V3m0 0 4.5 4.5M12 3 7.5 7.5M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5"/></Icon>;
export const MessageIcon = (p: IconProps) => <Icon {...p}><path d="M20 11.5a8 8 0 0 1-8 8H7l-4 2v-6a8 8 0 1 1 17-4Z"/><path d="m8.7 9.5 2 2 3.8-3.8"/></Icon>;
