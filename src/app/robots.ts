import type { MetadataRoute } from "next";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/public-routing";
import { shouldAllowIndexing } from "@/lib/site-indexing";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
  const allowIndexing = shouldAllowIndexing(appUrl, process.env.NEXT_PUBLIC_ALLOW_INDEXING);

  if (!allowIndexing) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  const base = appUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
