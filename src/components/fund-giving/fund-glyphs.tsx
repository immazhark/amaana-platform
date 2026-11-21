import type { ReactNode } from "react";

// Symbolic line glyphs, one per fund. Decorative only (aria-hidden); the fund name carries the meaning.
const HEART = "M24 39C12 30 7 23.5 7 17.5 7 12.8 10.6 9.5 15 9.5c3.4 0 6.2 1.9 9 5.5 2.8-3.6 5.6-5.5 9-5.5 4.4 0 8 3.3 8 8 0 6-5 12.5-17 21.5z";

const GLYPHS: Record<string, ReactNode> = {
  general: <path d={HEART} />,
  taleem: <><path d="M24 14v24M24 14c-4-3-10-4-16-3v24c6-1 12 0 16 3 4-3 10-4 16-3V11c-6-1-12 0-16 3z" /><circle cx="24" cy="7" r="1.8" className="accent" /></>,
  "modern-education": <><path d="M4 18l20-9 20 9-20 9z" /><path d="M12 22v9c0 3 5.4 6 12 6s12-3 12-6v-9M44 18v12" /></>,
  medical: <><path d={HEART} /><path d="M24 19v11M18.5 24.5h11" className="accent-stroke" /></>,
  orphan: <><path d="M7 24 24 9l17 15M12 21v18h24V21" /><path d="M24 35c-4-3-6-5-6-7.5a3.2 3.2 0 0 1 6-1.5 3.2 3.2 0 0 1 6 1.5c0 2.500-2 4.500-6 7.500z" className="accent" /></>,
  "eid-kits": <><path d="M8 20h32v20H8zM6 14h36v6H6zM24 14v26" /><path d="M24 14c-4-7-11-6-9-2 1.500 3 9 2 9 2zM24 14c4-7 11-6 9-2-1.500 3-9 2-9 2z" className="accent-stroke" /></>,
  "qurbani-meat": <><circle cx="24" cy="29" r="12" /><circle cx="24" cy="29" r="6.500" className="accent-stroke" /><path d="M7 7v10M11 7v10M9 7v23M41 7c-3 2-4 6-4 10h4v13" /></>,
  dates: <><path d="M24 43V22M24 22c-6-4-12-4-17-1M24 22c-6-4-10-10-9-15M24 22c0-6 2-12 7-15M24 22c6-4 12-4 17-1" /><circle cx="19" cy="34" r="2" className="accent" /><circle cx="29" cy="32" r="2" className="accent" /></>,
  "madarsa-operations": <><path d="M10 40V28a14 14 0 0 1 28 0v12M6 40h36M24 8v6" /><path d="M20 40v-8a4 4 0 0 1 8 0v8" className="accent-stroke" /></>,
  "foundation-operations": <path d="M6 18 24 8l18 10M10 18v18M20 18v18M28 18v18M38 18v18M6 40h36" />,
};

export function FundGlyph({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {GLYPHS[slug] ?? <circle cx="24" cy="24" r="14" />}
    </svg>
  );
}
