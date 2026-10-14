import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/navigation-link";
import { ZakatEstimator } from "@/components/zakat-estimator";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Educational Zakat Estimate",
  description: "A private INR Zakat estimate with visitor-entered nisab, eligible wealth and deductible liabilities. Requires qualified content review before public activation.",
  alternates: { canonical: "/zakat-calculator" },
  robots: { index: false, follow: false },
};

/** Editorial fail-closed switch. Until a qualified scholar reviews the rule
 * wording and content ownership signs off, the entire page is a 404 and
 * not linked by the Donate journey. Never treat a financial calculation
 * as an authorization to accept a Zakat-designated donation. */
export default function ZakatCalculatorPage() {
  if (process.env.AMAANA_ZAKAT_ESTIMATOR_REVIEWED !== "true") notFound();
  return <main className="v2-shell" aria-labelledby="zakat-page-heading">
    <div style={{ paddingBlock: "clamp(2rem,5vw,4rem) 1rem" }}>
      <p className="v2-section-label">Zakat · Educational planning</p>
      <h1 id="zakat-page-heading">Understand your Zakat estimate</h1>
      <p className="v2-section-intro">A private arithmetic guide for eligible monetary wealth. Enter your own current nisab threshold and confirm your lunar-year condition; no metal rates are fetched.</p>
      <Link href="/donate" className="v2-text-link">← Return to giving options</Link>
    </div>
    <ZakatEstimator/>
  </main>;
}
