import type { Metadata } from "next";
import { HomeStorySlide } from "@/components/home-story-slide";
import { HomeHighlights } from "@/components/home-highlights";
import { ScrollCarousel } from "@/components/scroll-carousel";
import { notFound } from "next/navigation";
import "@/app/home-showcase.css";
import "@/app/home-documentary.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home Hero Browser Acceptance Fixture",
  robots: { index: false, follow: false },
};

export default function HomeHeroBrowserAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="fixture-home-title">
        <h1 id="fixture-home-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>Amaana story browser fixture</h1>
        <ScrollCarousel label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          <HomeStorySlide />
          <HomeStorySlide />
        </ScrollCarousel>
      </section>
      <HomeHighlights />
    </div>
  );
}
