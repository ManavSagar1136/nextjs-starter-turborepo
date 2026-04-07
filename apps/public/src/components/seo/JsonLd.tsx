/**
 * Renders a JSON-LD structured data script tag.
 * Safe to use with server-generated data — never pass user-supplied HTML here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
