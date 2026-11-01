import Image from "next/image";
import { getPublicImageDimensions } from "@/lib/public-image-dimensions";
import { canRenderPublicMedia, getPublicImageOptimizationUrl, resolvePublicMediaUrl } from "@/lib/public-media";

type PublicMediaAsset = {
  id: string;
  kind: "IMAGE" | "VIDEO" | "DOCUMENT" | "EXTERNAL_VIDEO";
  title: string | null;
  publicUrl: string | null;
  externalUrl: string | null;
  altText: string | null;
  caption: string | null;
  sourceYear: number | null;
  width?: number | null;
  height?: number | null;
};

type PublicMediaProps = {
  asset: PublicMediaAsset;
  priority?: boolean;
  sizes?: string;
};

const defaultResponsiveSizes = "(max-width: 700px) 100vw, (max-width: 1200px) 70vw, 900px";

export function PublicMedia({ asset, priority = false, sizes = defaultResponsiveSizes }: PublicMediaProps) {
  if (!canRenderPublicMedia(asset)) return null;
  const url = resolvePublicMediaUrl(asset);
  if (!url) return null;

  if (asset.kind === "IMAGE") {
    const { width, height } = getPublicImageDimensions(asset);
    const optimizedUrl = getPublicImageOptimizationUrl(url);
    const image = optimizedUrl ? (
      <Image
        src={optimizedUrl}
        alt={asset.altText ?? ""}
        width={width}
        height={height}
        sizes={sizes}
        preload={priority}
        loading={priority ? undefined : "lazy"}
        decoding="async"
      />
    ) : (
      // External approved assets may live on multiple S3-compatible/CDN hosts; keep this direct until hosts are explicitly allowlisted for Next's optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={asset.altText ?? ""}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    );

    const caption = asset.caption?.trim();
    return (
      <figure className="v2-media-item">
        {/* Local approved campaign media uses Next's responsive optimizer. External approved HTTPS media stays direct until hosts are explicitly allowlisted. */}
        {image}
        {(caption || asset.sourceYear) && (
          <figcaption>{caption}{caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  if (asset.kind === "VIDEO") {
    const caption = asset.caption?.trim();
    const videoLabel = asset.title?.trim() || caption || "Amaana Foundation video";
    return (
      <figure className="v2-media-item">
        <video controls preload="none" playsInline aria-label={videoLabel}>
          <source src={url} />
        </video>
        {(caption || asset.sourceYear) && (
          <figcaption>{caption}{caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  // Whitespace-only editorial fields must not suppress accessible source labels.
  const displayTitle = asset.title?.trim() || asset.caption?.trim();
  const linkTitle = displayTitle || "approved source";
  return (
    <article className="v2-media-link">
      <small>{asset.kind === "DOCUMENT" ? "Document" : "Video"}{asset.sourceYear ? ` · ${asset.sourceYear}` : ""}</small>
      <h3>{displayTitle || "View approved source"}</h3>
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open approved source: ${linkTitle} (new tab)`}>Open approved source ↗</a>
    </article>
  );
}
