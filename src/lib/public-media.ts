type PublicMediaCandidate = {
  kind: "IMAGE" | "VIDEO" | "DOCUMENT" | "EXTERNAL_VIDEO";
  publicUrl?: string | null;
  externalUrl?: string | null;
  altText?: string | null;
};

function isSafePublicUrl(value: string | null | undefined) {
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolvePublicMediaUrl(asset: PublicMediaCandidate) {
  if (asset.kind === "EXTERNAL_VIDEO") {
    return isSafePublicUrl(asset.externalUrl) ? asset.externalUrl! : null;
  }

  return isSafePublicUrl(asset.publicUrl) ? asset.publicUrl! : null;
}

export function canRenderPublicMedia(asset: PublicMediaCandidate) {
  const url = resolvePublicMediaUrl(asset);
  if (!url) return false;

  if (asset.kind === "IMAGE" || asset.kind === "VIDEO") {
    return Boolean(asset.altText?.trim());
  }

  return true;
}
