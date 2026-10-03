import {
  buildPublicStructuredData,
  serializeStructuredData,
  type PublicStructuredDataInput,
} from "@/lib/structured-data";

export function PublicContentStructuredData(props: PublicStructuredDataInput) {
  const data = buildPublicStructuredData(props);
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      data-public-content-schema={props.type}
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}
