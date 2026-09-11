export function StructuredData() {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org").replace(/\/$/, "");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "NGO"],
        "@id": `${siteUrl}/#organization`,
        name: "Amaana Foundation",
        url: siteUrl,
        email: "amaanafoundation24@gmail.com",
        description: "A Hyderabad-based charitable organization connecting verified needs with compassionate domestic giving.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hyderabad",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        sameAs: [
          "https://www.instagram.com/amaanafoundation/",
          "https://www.facebook.com/amaanafoundation24/",
          "https://www.youtube.com/@amaanafoundation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Amaana Foundation",
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-IN",
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
