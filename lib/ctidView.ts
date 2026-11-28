import type { CtidItem, PrioritySignal } from "./ctidDigest";

export const categories = ["api", "identity", "cloud", "app", "threat", "other"] as const;
export type Category = (typeof categories)[number];

export function newsCategory(item: CtidItem): Category {
	const text = [item.title, item.summary, ...item.technologies].join(" ");
	if (/\b(apim|api management|api gateway|api security)\b/i.test(text)) return "api";
	if (/\b(entra(?:[ -]id)?|azure ad|azure active directory|oauth|oidc|saml|identity|iam|jwt)\b/i.test(text)) return "identity";
	if (/\b(azure|aws|cloud|kubernetes|docker|truenas|linux|traefik)\b/i.test(text)) return "cloud";
	if (/\b(next\.js|react|npm|python|fastapi|dependency|supply.chain|github)\b/i.test(text)) return "app";
	if (/\b(ransomware|malware|phishing|incident|breach|cve-\d{4}-\d+)\b/i.test(text)) return "threat";
	return "other";
}

const severityRank: Record<PrioritySignal, number> = {
	critical: 4,
	high: 3,
	medium: 2,
	informational: 1,
};

export type NewsFilters = {
	query: string;
	category: Category | "all";
	severity: PrioritySignal | "all";
	days: number;
	sort: "risk" | "date";
};

export function filterNews(items: CtidItem[], filters: NewsFilters, now: number) {
	const published = (item: CtidItem) => Date.parse(item.pubDate ?? "") || 0;
	const cutoff = now - filters.days * 86_400_000;
	const query = filters.query.trim().toLowerCase();
	return items.filter((item) => {
		const time = published(item);
		if (filters.days && (!time || time < cutoff || time > now)) return false;
		if (filters.category !== "all" && newsCategory(item) !== filters.category) return false;
		if (filters.severity !== "all" && item.severity !== filters.severity) return false;
		const aliases = item.technologies.flatMap((name) => {
			if (name === "Azure API Management") return ["APIM"];
			if (name === "Microsoft Entra ID") return ["Azure AD", "Azure Active Directory"];
			return [];
		});
		return [item.title, item.summary, item.source, ...item.technologies, ...aliases]
			.join(" ").toLowerCase().includes(query);
	}).sort((a, b) => (
		(filters.sort === "risk" ? severityRank[b.severity] - severityRank[a.severity] : 0) ||
		published(b) - published(a) || b.priority - a.priority
	));
}
