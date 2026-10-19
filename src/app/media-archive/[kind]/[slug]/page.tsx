import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublicMediaArchive, parsePublicArchivePage } from "@/lib/public-media-archive";
import { canonicalOurWorkDestination } from "@/lib/our-work-routing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Approved media archive",
  robots: { index: false, follow: true },
};

type Props = {
  params: Promise<{ kind: string; slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function PublicMediaArchivePage({ params, searchParams }: Props) {
  const { kind, slug } = await params;
  const page = parsePublicArchivePage((await searchParams).page);
  if (page === null) notFound();
  const archive = await getPublicMediaArchive(kind, slug, page);
  if (!archive) notFound();
  const back = kind === "initiative" ? canonicalOurWorkDestination(archive.slug)
    : kind === "story" ? `/stories/${encodeURIComponent(archive.slug)}`
      : `/faith-and-reflections/${encodeURIComponent(archive.slug)}`;
  const path = `/media-archive/${kind}/${encodeURIComponent(archive.slug)}`;
  return <div className="v2-home"><section className="v2-section paper"><div className="v2-shell">
    <a className="v2-text-link" href={back}>Back to {archive.title}</a>
    <h1>{archive.title}: approved media</h1>
    <p>Public-use reviewed photographs and supporting material. Page {page}.</p>
    <div className="v2-media-grid">{archive.media.map(asset => <PublicMedia key={asset.id} asset={asset} sizes="auto, (max-width: 700px) 100vw, (max-width: 1100px) 48vw, 29rem" />)}</div>
    <nav className="v2-hero-actions" aria-label="Media archive pages">
      {page > 1 ? <a className="v2-button" href={`${path}?page=${page - 1}`}>Previous page</a> : null}
      <span aria-current="page">Page {page}</span>
      {archive.hasNext ? <a className="v2-button" href={`${path}?page=${page + 1}`}>Next page</a> : null}
    </nav>
  </div></section></div>;
}
