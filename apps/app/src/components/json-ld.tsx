import type { StructuredData, StructuredDataGraph } from "@/lib/structured-data";

/**
 * Escapes the characters that could close the surrounding `<script>` tag.
 * The payload is our own data, but escaping keeps it safe once CMS content
 * starts flowing into schemas.
 */
function serialize(data: StructuredData | StructuredDataGraph): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Renders schema.org structured data so crawlers can read the page as data. */
export function JsonLd({ data }: { data: StructuredData | StructuredDataGraph }) {
  return (
    <script dangerouslySetInnerHTML={{ __html: serialize(data) }} type="application/ld+json" />
  );
}
