import type { Metadata } from "next";
import { HomeBannerSlide, HomeStorySlide } from "@/components/home-story-slide";
import Image from "next/image";
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

export default function HomeHeroBrowserAcceptanceFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();

  return (
    <div className="v3-home">
      <section className="v3-home-banner" aria-labelledby="fixture-home-title">
        <div className="amaana-backdrop-emblem" aria-hidden="true" />
        <h1 id="fixture-home-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>Amaana story browser fixture</h1>
        <ScrollCarousel label="Amaana Foundation story and featured work" mode="hero" className="v3-home-banner-carousel" autoAdvanceMs={7000}>
          <HomeStorySlide />
          <HomeBannerSlide eyebrow="Amaana Foundation · Our Work" title="Different Needs. One Standard of Care." description="Amaana’s work combines recurring programmes with verified case-led assistance, education, seasonal relief and emergency response." visual={<div className="v3-home-banner-media"><figure className="v2-media-item"><Image src="/backgrounds/Amaana_Website_Header_Banner.svg" width={1600} height={900} alt="Approved Amaana header artwork" sizes="(max-width: 900px) 100vw, 60vw" /></figure></div>} actions={[{ href: "/our-work", label: "Explore our work" }, { href: "/get-involved", label: "Ways to support", secondary: true }]} />
        </ScrollCarousel>
      </section>
      <HomeHighlights />
      <HomeGrowth />
      <HomeTrust />
    </div>
  );
}
