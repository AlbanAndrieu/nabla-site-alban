type JsonLdValue = Record<string, unknown> | readonly Record<string, unknown>[];

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is data rather than executable code. Escaping `<` prevents a
      // payload from terminating the script element.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
