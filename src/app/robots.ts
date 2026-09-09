import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/donations/", "/request-assistance/status", "/request-assistance/received"] }, sitemap: "https://amaanafoundation.org/sitemap.xml", host: "https://amaanafoundation.org" }; }
