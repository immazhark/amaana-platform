import type { Metadata } from "next";
import { ConfiguredHomeSlide } from "@/components/home-story-slide";
import { defaultHomeSlides } from "@/lib/home-carousel";
import { HomeGrowth, HomeTrust } from "@/components/home-evidence";
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

export default async function HomeHeroBrowserAcceptanceFixture({ searchParams }: { searchParams: Promise<{ long?: string }> }) {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  const { long } = await searchParams;
  const slides = defaultHomeSlides.map((slide, index) => long === "true" && index === 4 ? { ...slide, title: "Qurbani Meat Distribution. Thoughtful preparation and dignified support that reaches more families.", description: "Amaana coordinates practical assistance with care for the dignity of every family. This extended editorial introduction exercises the full space available to administrators, with readable text, programme context and clear actions across narrow mobile and desktop screens. Learn about the main programme and its history.".slice(0,320) } : slide);

  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="fixture-home-title">
        <div className="amaana-backdrop-emblem" aria-hidden="true" />
        <h1 id="fixture-home-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>Amaana story browser fixture</h1>
        <ScrollCarousel cinematic label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          {slides.map((slide, index) => <ConfiguredHomeSlide key={slide.id} slide={index === 0 ? { ...slide, image: 'logo' } : slide} priority={index === 0} />)}
        </ScrollCarousel>
      </section>
      <HomeHighlights />
      <HomeGrowth />
      <HomeTrust />
    </div>
  );
}
