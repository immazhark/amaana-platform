import type { MetadataRoute } from "next";
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
      disallow: ["/admin/", "/api/", "/donate/", "/donations/", "/request-assistance/status", "/request-assistance/received"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
