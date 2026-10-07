import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignMediaGallery, type CampaignGalleryItem } from "@/components/campaign-media-gallery";
import "@/app/our-work/[slug]/campaign.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaign Gallery Browser Acceptance Fixture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function svgData(index: number, width: number, height: number) {
  const label = `Gallery fixture ${index}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e9eff8"/><rect x="24" y="24" width="${Math.max(1, width - 48)}" height="${Math.max(1, height - 48)}" rx="28" fill="#fffdf8" stroke="#b8890e" stroke-width="8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#122239" font-family="Arial, sans-serif" font-size="${Math.max(28, Math.round(Math.min(width, height) / 12))}" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const items: CampaignGalleryItem[] = Array.from({ length: 13 }, (_, index) => {
  const portrait = index % 4 === 1;
  const width = portrait ? 900 : 1600;
  const height = portrait ? 1600 : 1000;
  return {
    id: `fixture-${index + 1}`,
    url: svgData(index + 1, width, height),
    alt: `Synthetic acceptance photograph ${index + 1}`,
    caption: index % 3 === 0
      ? `Synthetic caption ${index + 1} used to verify wrapping, card rhythm and lightbox containment without reading public media records.`
      : null,
    width,
    height,
  };
});

export default function CampaignGalleryBrowserAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v2-home campaign-page">
      <section className="campaign-gallery" id="campaign-gallery">
        <div className="v2-shell">
          <div className="campaign-section-heading">
            <p className="v2-section-label">Browser acceptance fixture</p>
            <h1>Initiative gallery interaction</h1>
            <p>Synthetic local artwork validates gallery geometry and interaction without accessing beneficiary media.</p>
          </div>
          <CampaignMediaGallery items={items} />
        </div>
      </section>
    </div>
  );
}
