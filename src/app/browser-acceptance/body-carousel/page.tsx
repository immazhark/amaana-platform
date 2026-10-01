import { notFound } from "next/navigation";
import { BodyCarousel, BodyCard } from "@/components/body-carousel";
export const dynamic = "force-dynamic";
export default function BodyCarouselFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  return <main style={{maxWidth:1200,margin:"auto",padding:24}}><BodyCarousel label="Body carousel acceptance" heading={<h2>Programme records</h2>} autoAdvanceMs={3000}>{Array.from({length:7},(_,index)=><BodyCard key={index} title={`Programme ${index + 1}`} meta={2020 + index}><p>A documented programme record.</p><a href="/about">Explore programme</a></BodyCard>)}</BodyCarousel></main>;
}
