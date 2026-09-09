export function StructuredData() {
  const data = { "@context": "https://schema.org", "@type": "Organization", name: "Amaana Foundation", url: "https://amaanafoundation.org", email: "amaanafoundation24@gmail.com", areaServed: "India", address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" }, description: "A Hyderabad-based charitable organization connecting verified needs with compassionate domestic giving." };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
