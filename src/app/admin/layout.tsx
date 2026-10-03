import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Amaana Admin",
    template: "%s | Amaana Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: "no-referrer",
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
