import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./brand.css";
import "./media.css";
import "./appeal-card.css";
import "./error-experience.css";
import "./refinement.css";
import "./iteration-three.css";
import "./brand-expression.css";
import "./loading-experience.css";
import "./world-class-polish.css";
import "./home-media-polish.css";
import "./experience-finish.css";
import "./islamic-backdrops.css";
import "./islamic-companion.css";
import "./accessibility.css";
import "./iteration-four.css";
import "./page-hero.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { IslamicCompanion } from "@/components/islamic-companion";
import { Analytics } from "@/components/analytics";
import { StructuredData } from "@/components/structured-data";
import { BackToTop } from "@/components/back-to-top";
import { shouldAllowIndexing } from "@/lib/site-indexing";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
const allowIndexing = shouldAllowIndexing(appUrl, process.env.NEXT_PUBLIC_ALLOW_INDEXING);
const organizationDescription = "Amaana Foundation is a Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance with dignity, transparency and accountability.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Amaana Foundation", template: "%s | Amaana Foundation" },
  description: organizationDescription,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Amaana Foundation",
    title: "Amaana Foundation",
    description: organizationDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaana Foundation",
    description: organizationDescription,
  },
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="v2-skip-link" href="#main">Skip to content</a>
        <StructuredData />
        <Analytics />
        <SiteHeader />
        <IslamicCompanion />
        <main id="main">{children}</main>
        <BackToTop />
        <SiteFooter />
      </body>
    </html>
  );
}
