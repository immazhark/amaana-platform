import Image from "next/image";

const artworks: Record<string, { src: string; alt: string }> = {
  "eid-gift-kits": { src: "/programme-artwork/eid-diagonal-v3.webp", alt: "Photo collage of Amaana Eid Gift Kits prepared and packed for distribution." },
  taleem: { src: "/programme-artwork/taleem-diagonal-v3.webp", alt: "Photo collage of learning materials and packaged education kits from Amaana Taleem." },
  "qurbani-meat-distribution": { src: "/programme-artwork/qurbani-diagonal-v3.webp", alt: "Photo collage of labelled Qurbani meat boxes prepared for distribution." },
  "dates-distribution": { src: "/programme-artwork/dates-diagonal-v3.webp", alt: "Photo collage showing Amaana Ramadan dates packages." },
  "winter-relief": { src: "/programme-artwork/winter-diagonal-v3.webp", alt: "Photo collage of winter essentials packed for Amaana's seasonal relief programme." },
  "hyderabad-flood-relief-2020": { src: "/programme-artwork/flood-diagonal-v3.webp", alt: "Photo collage of the 2020 Hyderabad flood-relief response; original face blur retained." },
  "medical-financial-relief": { src: "/hero/medical.webp", alt: "Programme collage representing documented medical and livelihood assistance." },
};
const categoryArtwork: Record<string, string> = {
  "ramadan-eid": "eid-gift-kits",
  "amaana-taleem": "taleem",
  "seasonal-relief": "winter-relief",
  "emergency-humanitarian-relief": "hyderabad-flood-relief-2020",
};

function getProgrammeArtwork(slug: string) {
  const mapped = Object.hasOwn(categoryArtwork, slug) ? categoryArtwork[slug] : undefined;
  const artworkSlug = mapped ?? slug;
  return Object.hasOwn(artworks, artworkSlug) ? artworks[artworkSlug] : undefined;
}

export function ProgrammeArtwork({ slug, sizes = "(max-width: 700px) 86vw, 30rem", priority = false }: { slug: string; sizes?: string; priority?: boolean }) {
  const artwork = getProgrammeArtwork(slug);
  if (!artwork) return null;
  return <Image src={artwork.src} width={1536} height={1024} alt={artwork.alt} sizes={sizes} preload={priority} loading={priority ? undefined : "lazy"} data-programme-artwork={slug} />;
}

export function hasProgrammeArtwork(slug: string) {
  return Boolean(getProgrammeArtwork(slug));
}
