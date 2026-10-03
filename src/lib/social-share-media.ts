export const DEFAULT_SOCIAL_ALT = "Amaana Foundation";

export function openGraphShareImages(imageUrl?: string, alt?: string) {
  return imageUrl
    ? [{ url: imageUrl, alt: alt ?? DEFAULT_SOCIAL_ALT }]
    : [{ url: "/opengraph-image", width: 1200, height: 630, alt: DEFAULT_SOCIAL_ALT }];
}

export function twitterShareImages(imageUrl?: string) {
  return imageUrl ? [imageUrl] : ["/twitter-image"];
}
