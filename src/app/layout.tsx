import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./v2.css";
import "./brand.css";
import "./media.css";
import "./appeal-card.css";
import "./error-experience.css";
import "./refinement.css";
// Brand expression also carries the former adjacent iteration-three rules so the
// verified cascade stays intact without an extra global stylesheet layer.
import "./brand-expression.css";
import "./loading-experience.css";
import "./world-class-polish.css";
import "./islamic-backdrops.css";
import "./islamic-companion.css";
import "./iteration-four.css";
import "./page-hero.css";
// Canonical visual-system reconciliation: route layers may define structure,
// but the shared Amaana surface/action system must resolve after them.
import "./experience-finish.css";
import "./site-chrome.css";
// Accessibility remains the final authority for focus, motion and readability.
import "./accessibility.css";
import { SiteMotion } from "@/components/site-motion";
import "lenis/dist/lenis.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { IslamicCompanion } from "@/components/islamic-companion";
import { Analytics } from "@/components/analytics";
import { StructuredData } from "@/components/structured-data";
import { BackToTop } from "@/components/back-to-top";
import { NavigationProgress } from "@/components/navigation-progress";
import { shouldAllowIndexing } from "@/lib/site-indexing";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
const allowIndexing = shouldAllowIndexing(appUrl, process.env.NEXT_PUBLIC_ALLOW_INDEXING);
const organizationDescription = "Amaana Foundation is a Hyderabad-based registered charitable trust supporting verified community needs through relief, education, seasonal programmes and case-led assistance with dignity, transparency and accountability.";
const socialAlt = "Amaana Foundation — Upholding Trust. Serving With Compassion, Dignity and Accountability.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#122239",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Amaana Foundation", template: "%s | Amaana Foundation" },
  description: organizationDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Amaana Foundation",
    title: "Amaana Foundation",
    description: organizationDescription,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: socialAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaana Foundation",
    description: organizationDescription,
    images: [{ url: "/twitter-image", alt: socialAlt }],
  },
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a className="v2-skip-link" href="#main">Skip to content</a>
        <StructuredData />
        <Analytics />
        <SiteMotion />
        <NavigationProgress />
        <SiteHeader />
        <IslamicCompanion />
        <main id="main" tabIndex={-1}>{children}</main>
        <BackToTop />
        <SiteFooter />
      </body>
    </html>
  );
}
