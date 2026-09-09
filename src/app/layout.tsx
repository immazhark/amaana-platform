import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org"),
  title: { default: "Amaana Foundation", template: "%s | Amaana Foundation" },
  description: "Verified appeals and dignified assistance from Amaana Foundation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a href="#main" style={{position: "absolute", left: "-9999px"}}>Skip to content</a><SiteHeader /><main id="main">{children}</main><SiteFooter /></body></html>;
}
