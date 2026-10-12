import { type FeedItem, type RankedFeedItem, rankArticles } from "@/lib/cisoThreatFeed";

export type PrioritySignal = "critical" | "high" | "medium" | "informational";
export type CtidItem = RankedFeedItem & { severity: PrioritySignal; serviceIds: string[] };

const SERVICE_IDS: Record<string, string> = {
	pfSense: "pfsense",
	TrueNAS: "truenas",
	PostgreSQL: "postgresql",
	Grafana: "grafana",
	Prometheus: "prometheus",
	LiteLLM: "litellm",
	Ollama: "ollama",
	Langfuse: "langfuse",
	Vaultwarden: "vaultwarden",
	FreshRSS: "freshrss",
	ClickHouse: "clickhouse",
};

export function editorialSeverity(article: RankedFeedItem): PrioritySignal {
	const text = (article.title + " " + (article.summary ?? "")).toLowerCase();
	if (/\b(actively exploited|exploited in the wild|zero.day|cisa kev|critical rce)\b/.test(text)) return "critical";
	if (/\b(cve-\d{4}-\d{4,}|ransomware|remote code execution|critical vulnerability|supply.chain attack)\b/.test(text)) return "high";
	if (/\b(vulnerability|patch|advisory|security update|exploit|incident|breach)\b/.test(text)) return "medium";
	return "informational";
}
const order: Record<PrioritySignal, number> = { critical: 4, high: 3, medium: 2, informational: 1 };

/** Every score is editorial only; DefectDojo/CVSS verified scores are not yet present. */
export function selectCtidDigest(feed: FeedItem[]): {
	homelab: CtidItem[];
	global: CtidItem[];
	other: CtidItem[];
} {
	const all = rankArticles(feed).map((article) => ({
		...article,
		severity: editorialSeverity(article),
		serviceIds: Array.from(new Set(article.technologies.flatMap((name) => SERVICE_IDS[name] ? [SERVICE_IDS[name]] : []))),
	}));
	const byRisk = (a: CtidItem, b: CtidItem) =>
		order[b.severity] - order[a.severity] ||
		b.priority - a.priority ||
		(Date.parse(b.pubDate ?? "") || 0) - (Date.parse(a.pubDate ?? "") || 0);
	const relevant = all.filter((item) => item.technologies.length > 0).sort(byRisk);
	const broad = all.filter((item) => item.technologies.length === 0).sort(byRisk);
	const homelab = relevant.slice(0, 5);
	const global = broad.slice(0, 5);
	const remaining = 10 - homelab.length - global.length;
	const fillers = [...relevant.slice(5), ...broad.slice(5)].sort(byRisk).slice(0, remaining);
	for (const item of fillers) {
		if (item.technologies.length) homelab.push(item);
		else global.push(item);
	}
	const picked = new Set([...homelab, ...global].map((item) => item.link));
	const other = all.filter((item) => !picked.has(item.link));
	return { homelab, global, other };
}
