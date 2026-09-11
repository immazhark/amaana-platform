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

export function PublicMedia({ asset }: { asset: PublicMediaAsset }) {
  if (!canRenderPublicMedia(asset)) return null;
  const url = resolvePublicMediaUrl(asset);
  if (!url) return null;

  if (asset.kind === "IMAGE") {
    return (
      <figure className="v2-media-item">
        {/* Approved assets may be served from multiple S3-compatible/CDN hosts, so this public-safe renderer validates URLs before using a native image element. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={asset.altText ?? ""} loading="lazy" />
        {(asset.caption || asset.sourceYear) && (
          <figcaption>{asset.caption}{asset.caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  if (asset.kind === "VIDEO") {
    return (
      <figure className="v2-media-item">
        <video controls preload="metadata" aria-label={asset.title ?? asset.caption ?? "Amaana Foundation video"}>
          <source src={url} />
        </video>
        {(asset.caption || asset.sourceYear) && (
          <figcaption>{asset.caption}{asset.caption && asset.sourceYear ? " · " : ""}{asset.sourceYear ?? ""}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <article className="v2-media-link">
      <small>{asset.kind === "DOCUMENT" ? "Document" : "Video"}{asset.sourceYear ? ` · ${asset.sourceYear}` : ""}</small>
      <h3>{asset.title ?? asset.caption ?? "View approved source"}</h3>
      <a href={url} target="_blank" rel="noreferrer">Open approved source ↗</a>
    </article>
  );
}
