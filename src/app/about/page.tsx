import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { PublicMedia } from "@/components/public-media";
import { getAboutOriginMedia } from "@/lib/about-media";
import { aboutCopy } from "@/lib/organization-copy";

export const metadata = {
  title: aboutCopy.title,
  description: aboutCopy.intro,
  alternates: { canonical: "/about" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
    type: "website",
    url: "/about",
    title: `${aboutCopy.title} | Amaana Foundation`,
    description: aboutCopy.intro,
  },
  twitter: { images: ["/twitter-image"],
    card: "summary_large_image",
    title: `${aboutCopy.title} | Amaana Foundation`,
    description: aboutCopy.intro,
  },
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const originMedia = await getAboutOriginMedia();

  return (
    <CanonicalArticle
      eyebrow="Amaana Foundation · Hyderabad"
      heroVariant="level1"
      heroVisual={originMedia ? <PublicMedia asset={originMedia} priority /> : undefined}
      heroVisualTitle="Our Story"
      heroVisualNote="From community-led Ramadan support to a charitable trust serving verified needs with dignity and accountability."
      bodyClassName="canonical-body--about"
      bodyId="about-story"
      heroActions={[{ label: "Our journey & values", href: "#about-story" }, { label: "Explore our work", href: "/our-work", secondary: true }]}
      {...aboutCopy}
    >
      <section className="canonical-block canonical-block--about-recognition">
        <h2>Recognition from AMP</h2>
        <div>
          <p>Amaana Foundation received the Best NGO Award of the Year (Telangana) at AMP’s 5th National Awards for Social Excellence 2025.</p>
          <Link href="/recognition">View the Certificate of Excellence →</Link>
        </div>
      </section>
      <section className="canonical-block canonical-block--about-record">
        <h2>Learn more about how Amaana works</h2>
        <div>
          <p>Meet the people responsible for Amaana, understand how requests for support are reviewed, and see how we share useful updates while protecting private information.</p>
          <p><Link href="/governance">Governance & trustees →</Link></p>
          <p><Link href="/how-we-verify">How verification works →</Link></p>
          <p><Link href="/transparency">Transparency & reporting →</Link></p>
        </div>
      </section>
    </CanonicalArticle>
  );
}
