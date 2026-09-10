import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";
import { StructuredData } from "@/components/structured-data";

const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org"),
  title: { default: "Amaana Foundation", template: "%s | Amaana Foundation" },
  description: "Verified appeals and dignified assistance from Amaana Foundation.",
  openGraph: { type: "website", locale: "en_IN", siteName: "Amaana Foundation", title: "Amaana Foundation", description: "Verified appeals and dignified assistance from Hyderabad, India.", url: "/" },
  twitter: { card: "summary_large_image", title: "Amaana Foundation", description: "Verified appeals and dignified assistance." },
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main" style={{position: "absolute", left: "-9999px"}}>Skip to content</a><StructuredData/><Analytics/><SiteHeader /><main id="main">{children}</main><SiteFooter /></body></html>;
}
