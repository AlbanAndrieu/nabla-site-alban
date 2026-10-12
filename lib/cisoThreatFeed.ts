/** Name-only stack hints from nabla-compose catalog. NOT a runtime inventory or a vulnerability assessment. */
export const STACK_SIGNALS = [
  { name: "Kubernetes", terms: ["kubernetes", "k8s"] },
  { name: "Talos", terms: ["talos linux", "talos os"] },
  { name: "Docker", terms: ["docker", "containerd"] },
  { name: "Traefik", terms: ["traefik"] },
  { name: "Cloudflare", terms: ["cloudflare"] },
  { name: "pfSense", terms: ["pfsense", "pf sense"] },
  { name: "TrueNAS", terms: ["truenas"] },
  { name: "ZFS", terms: ["openzfs", "zfs"] },
  { name: "PostgreSQL", terms: ["postgresql", "postgres"] },
  { name: "Redis", terms: ["redis"] },
  { name: "ClickHouse", terms: ["clickhouse"] },
  { name: "Kafka", terms: ["apache kafka", "kafka"] },
  { name: "OpenSearch", terms: ["opensearch"] },
  { name: "Nginx", terms: ["nginx"] },
  { name: "Grafana", terms: ["grafana"] },
  { name: "Prometheus", terms: ["prometheus"] },
  { name: "Loki", terms: ["grafana loki"] },
  { name: "Sentry", terms: ["sentry"] },
  { name: "LiteLLM", terms: ["litellm"] },
  { name: "Ollama", terms: ["ollama"] },
  { name: "Langfuse", terms: ["langfuse"] },
  { name: "Vaultwarden", terms: ["vaultwarden"] },
  { name: "DefectDojo", terms: ["defectdojo"] },
  { name: "FreshRSS", terms: ["freshrss"] },
  { name: "Next.js", terms: ["next.js", "nextjs"] },
  { name: "React", terms: ["react", "reactjs"] },
  { name: "GitHub Actions", terms: ["github actions"] },
] as const;

export type FeedItem = {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  summary?: string;
};

export type RankedFeedItem = FeedItem & {
  technologies: string[];
  priority: number;
  urgent: boolean;
};

const signals = STACK_SIGNALS.map((signal) => ({
  name: signal.name,
  patterns: signal.terms.map((term) =>
    new RegExp("(^|[^a-z0-9])" + term.replace(/[.*+?^$()|[\]{}\\]/g, "\\$&") + "(?=$|[^a-z0-9])", "i"),
  ),
}));
const urgency = /\b(CVE-\d{4}-\d{4,}|actively exploited|exploited in the wild|zero.day|remote code execution|ransomware|critical vulnerability|supply.chain attack)\b/i;

export function safeArticleUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username || url.password ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".int.albandrieu.com") ||
      /^(127|10|192\.168)\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return null;
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^utm_/i.test(key) || ["fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch {
    return null;
  }
}

export function plainText(input: unknown, maxLength = 220): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:lt|#60);/gi, "<")
    .replace(/&(?:gt|#62);/gi, ">")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeArticle(input: Partial<FeedItem>): FeedItem | null {
  const link = safeArticleUrl(input.link);
  const title = plainText(input.title, 240);
  if (!link || !title) return null;
  const source = plainText(input.source, 90) || new URL(link).hostname;
  const summary = plainText(input.summary, 260);
  const time = typeof input.pubDate === "string" ? Date.parse(input.pubDate) : NaN;
  return {
    link, title, source,
    ...(Number.isFinite(time) ? { pubDate: new Date(time).toISOString() } : {}),
    ...(summary ? { summary } : {}),
  };
}

export function rankArticles(input: FeedItem[]): RankedFeedItem[] {
  const seen = new Set<string>();
  const ranked: RankedFeedItem[] = [];
  for (const raw of input) {
    const item = normalizeArticle(raw);
    if (!item) continue;
    const identity = item.link.toLowerCase();
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(identity) || (titleKey.length > 40 && seen.has("title:" + titleKey))) continue;
    seen.add(identity);
    if (titleKey.length > 40) seen.add("title:" + titleKey);
    const corpus = item.title + " " + (item.summary ?? "");
    const technologies = signals.filter((signal) =>
      signal.patterns.some((pattern) => pattern.test(corpus))
    ).map((signal) => signal.name);
    const urgent = urgency.test(corpus);
    ranked.push({ ...item, technologies, urgent, priority: technologies.length * 3 + (urgent ? 2 : 0) });
  }
  return ranked.sort((a, b) =>
    b.priority - a.priority ||
    (Date.parse(b.pubDate ?? "") || 0) - (Date.parse(a.pubDate ?? "") || 0)
  );
}
