import Image from "next/image";
import { canRenderPublicMedia, resolvePublicMediaUrl } from "@/lib/public-media";

type PublicMediaAsset = {
  id: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT" | "EXTERNAL_VIDEO";
  title: string | null;
  publicUrl: string | null;
  externalUrl: string | null;
  altText: string | null;
  caption: string | null;
  sourceYear: number | null;
};

type PublicMediaProps = {
  asset: PublicMediaAsset;
  priority?: boolean;
  sizes?: string;
};

const defaultResponsiveSizes = "(max-width: 700px) 100vw, (max-width: 1200px) 70vw, 900px";

function canOptimizeLocally(url: string) {
  return url.startsWith("/media/") || url.startsWith("/brand/");
}

export function PublicMedia({ asset, priority = false, sizes = defaultResponsiveSizes }: PublicMediaProps) {
  if (!canRenderPublicMedia(asset)) return null;
  const url = resolvePublicMediaUrl(asset);
  if (!url) return null;

  if (asset.kind === "IMAGE") {
    const image = canOptimizeLocally(url) ? (
      <Image
        src={url}
        alt={asset.altText ?? ""}
        width={1600}
        height={1200}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    ) : (
      <img
        src={url}
        alt={asset.altText ?? ""}
        width={1600}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    );

    return (
      <figure className="v2-media-item">
        {/* Local approved campaign media uses Next's responsive optimizer. External approved HTTPS media stays direct until hosts are explicitly allowlisted. */}
        {image}
        {(asset.caption || asset.sourceYear) && (
          <figcaption>{asset.caption}{asset.caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  if (asset.kind === "VIDEO") {
    return (
      <figure className="v2-media-item">
        <video controls preload="none" playsInline aria-label={asset.title ?? asset.caption ?? "Amaana Foundation video"}>
          <source src={url} />
        </video>
        {(asset.caption || asset.sourceYear) && (
          <figcaption>{asset.caption}{asset.caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  const linkTitle = asset.title ?? asset.caption ?? "approved source";
  return (
    <article className="v2-media-link">
      <small>{asset.kind === "DOCUMENT" ? "Document" : "Video"}{asset.sourceYear ? ` · ${asset.sourceYear}` : ""}</small>
      <h3>{asset.title ?? asset.caption ?? "View approved source"}</h3>
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${linkTitle} in a new tab`}>Open approved source ↗</a>
    </article>
  );
}
