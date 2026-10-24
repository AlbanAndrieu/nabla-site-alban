/** Local, deterministic placeholder used only when a bundled service icon fails. */
export type HomelabIconFallback = {
  label: string;
  backgroundColor: string;
};

/** A readable identity cue with no URLs, HTML, or network requests. */
export function homelabIconFallback(
  serviceId: string,
  displayName: string,
): HomelabIconFallback {
  const normalizedId = serviceId.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const cleanName = displayName.normalize("NFKC").slice(0, 80);
  const words = cleanName.match(/[\p{L}\p{N}]+/gu) ?? [];
  const fallbackWords = normalizedId.split("-").filter(Boolean);
  const tokens = words.length ? words : fallbackWords;
  const label = (
    tokens.length > 1
      ? tokens.slice(0, 3).map((word) => Array.from(word)[0] ?? "").join("")
      : Array.from(tokens[0] ?? "?").slice(0, 3).join("")
  ).toUpperCase();
  // Hash the canonical service ID so repeated names still get a stable color.
  let hash = 2166136261;
  for (const char of normalizedId) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return { label, backgroundColor: `hsl(${hash % 360} 48% 28%)` };
}
