import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobileSupportBar } from "@/components/mobile-support-bar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mobile Support Browser Acceptance Fixture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ state?: string }> };

export default async function MobileSupportBrowserAcceptanceFixture({ searchParams }: Props) {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  const { state } = await searchParams;
  const open = state !== "closed";

  return (
    <div className="v2-home">
      <main id="fixture-main" style={{ minHeight: "1800px", padding: "3rem 1rem" }}>
        <h1>Mobile support acceptance fixture</h1>
        <p>This synthetic page validates the mobile support action without reading or mutating appeal data.</p>
        <p style={{ marginTop: "900px" }}>Scrollable acceptance content.</p>
      </main>
      {open ? (
        <MobileSupportBar
          href="/donate/browser-acceptance"
          label="Support this appeal"
          context="₹25,000 remaining verified need"
        />
      ) : null}
    </div>
  );
}
