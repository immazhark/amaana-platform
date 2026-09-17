import Link from "next/link";
import { CanonicalArticle } from "@/components/canonical-article";
import { PublicMedia } from "@/components/public-media";
import { getAboutOriginMedia } from "@/lib/about-media";
import { aboutCopy } from "@/lib/organization-copy";

export const metadata = {
  title: aboutCopy.title,
  description: aboutCopy.intro,
  alternates: { canonical: "/about" },
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
      {...aboutCopy}
    >
      <section className="canonical-block">
        <h2>Recognition from AMP</h2>
        <div>
          <p>Amaana Foundation received the Best NGO Award of the Year (Telangana) at AMP’s 5th National Awards for Social Excellence 2025.</p>
          <Link href="/recognition">View the Certificate of Excellence →</Link>
        </div>
      </section>
      <section className="canonical-block">
        <h2>Continue the public record</h2>
        <div>
          <p>Learn who carries formal responsibility for Amaana, how verified needs are handled, and how public evidence is separated from private proof.</p>
          <p><Link href="/governance">Governance & trustees →</Link></p>
          <p><Link href="/how-we-verify">How verification works →</Link></p>
          <p><Link href="/transparency">Transparency & reporting →</Link></p>
        </div>
      </section>
    </CanonicalArticle>
  );
}
