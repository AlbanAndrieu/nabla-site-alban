"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { type FeedItem, normalizeArticle } from "@/lib/cisoThreatFeed";
import { type CtidItem, selectCtidDigest } from "@/lib/ctidDigest";
import { type NewsFilters, filterNews, newsCategory } from "@/lib/ctidView";
import CtidFilters, { type CtidCopy, initialFilters, signalLabels } from "./CtidFilters";
import styles from "./CtidIntelligence.module.css";

type Language = AppLocale;

async function fetchNews(
	signal: AbortSignal,
): Promise<{ items: FeedItem[]; mode: string }> {
	try {
		const response = await fetch("/api/ciso/threat-feed?view=ctid", { signal });
		if (!response.ok) throw new Error("FreshRSS unavailable");
		const data = (await response.json()) as {
			items?: FeedItem[];
			mode?: string;
		};
		if (!Array.isArray(data.items)) throw new Error("Malformed feed response");
		return {
			items: data.items,
			mode:
				data.mode === "ai-filtered"
					? "FreshRSS · Langfuse / LiteLLM"
					: "FreshRSS",
		};
	} catch {
		if (signal.aborted) throw new Error("Aborted");
		const configResponse = await fetch("/ciso-security-sources.json", {
			signal,
		});
		if (!configResponse.ok) throw new Error("RSS fallback list unavailable");
		const config = (await configResponse.json()) as {
			sources?: Array<{ url?: string }>;
		};
		const sources = (config.sources ?? [])
			.filter((entry) => {
				try {
					return new URL(entry.url ?? "").protocol === "https:";
				} catch {
					return false;
				}
			})
			.slice(0, 10);
		const results = await Promise.allSettled(
			sources.map(async (entry) => {
				const endpoint =
					"https://api.rss2json.com/v1/api.json?rss_url=" +
					encodeURIComponent(entry.url ?? "");
				const res = await fetch(endpoint, { signal });
				if (!res.ok) throw new Error("Source unavailable");
				const data = (await res.json()) as {
					feed?: { title?: string };
					items?: Array<{
						title?: string;
						link?: string;
						pubDate?: string;
						description?: string;
					}>;
				};
				return (data.items ?? []).slice(0, 5).flatMap((item) => {
					const normalized = normalizeArticle({
						title: item.title,
						link: item.link,
						pubDate: item.pubDate,
						source: data.feed?.title ?? "RSS",
						summary: item.description,
					});
					return normalized ? [normalized] : [];
				});
			}),
		);
		return {
			items: results.flatMap((result) =>
				result.status === "fulfilled" ? result.value : [],
			),
			mode: "RSS public · fallback",
		};
	}
}

const titleLabels = {
	fr: {
		homelab: "Signaux concernant la stack Nabla",
		global: "Cybermenaces et actualités mondiales",
		other: "Autres vulnérabilités et actualités",
		analysis: "Résumé",
		details: "Plus de détails",
		evidence:
			"Criticité indicative, basée sur le titre et le résumé. Aucun impact sur le homelab n'est confirmé sans inventaire, version affectée et validation technique.",
		service: "Voir le service dans TrueNAS",
		empty: "Aucun signal vérifiable dans les sources disponibles.",
		load: "Chargement des flux de veille…",
		retry: "Réessayer",
		date: "Date de publication",
		source: "Source",
		tech: "Technologies mentionnées",
	},
	en: {
		homelab: "Signals relevant to the Nabla stack",
		global: "Global cybersecurity intelligence",
		other: "Other vulnerabilities and security news",
		analysis: "Summary",
		details: "More details",
		evidence:
			"Editorial severity derived from title and summary only. No homelab impact is confirmed without version evidence and technical verification.",
		service: "View service on TrueNAS page",
		empty: "No usable articles from available sources.",
		load: "Loading security feeds…",
		retry: "Retry",
		date: "Published",
		source: "Source",
		tech: "Technologies mentioned",
	},
} as const;


function CtidCard({
	item,
	locale,
	featured,
	copy,
}: {
	item: CtidItem;
	locale: Language;
	featured: boolean;
	copy: CtidCopy;
}) {
	const t = titleLabels[locale];
	return (
		<article className={styles.card}>
			<div className={styles.meta}>
				<span className={styles.severity} data-level={item.severity}>
					{signalLabels[locale][item.severity]}
				</span>
				<span>{item.source}</span>
				<span>{copy.categories[newsCategory(item)]}</span>
				{item.pubDate && (
					<time dateTime={item.pubDate}>
						{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
							new Date(item.pubDate),
						)}
					</time>
				)}
			</div>
			<h3>
				<a href={item.link} target="_blank" rel="noopener noreferrer">
					{item.title} ↗
				</a>
			</h3>
			{locale === "fr" && <p className={styles.notice}>{copy.original}</p>}
			{featured && (
				<p className={styles.summary}>
					{item.summary ||
						(locale === "fr"
							? "Consulter la source originale pour le contexte."
							: "See the original source for context.")}
				</p>
			)}
			{!featured && (
				<details className={styles.disclosure}>
					<summary>{t.analysis}</summary>
					<p>
						{item.summary ||
							(locale === "fr"
								? "Résumé indisponible : lire la source."
								: "No excerpt available: see original.")}
					</p>
				</details>
			)}
			<details className={styles.disclosure}>
				<summary>{t.details}</summary>
				<p>{t.evidence}</p>
				<dl className={styles.facts}>
					<dt>{t.source}</dt>
					<dd>{item.source}</dd>
					{item.pubDate && (
						<>
							<dt>{t.date}</dt>
							<dd>{item.pubDate.slice(0, 10)}</dd>
						</>
					)}
					<dt>{t.tech}</dt>
					<dd>{item.technologies.join(", ") || "—"}</dd>
				</dl>
				{item.serviceIds.map((id) => (
					<a
						key={id}
						className={styles.serviceLink}
						href={`${locale === "fr" ? "/fr" : ""}/truenas#homelab-service-${id}`}
					>
						{t.service} : {id} ↗
					</a>
				))}
			</details>
		</article>
	);
}

export default function CtidIntelligence({ locale, copy }: { locale: Language; copy: CtidCopy }) {
	const [filters, setFilters] = useState<NewsFilters>(initialFilters);
	const [fetchedAt, setFetchedAt] = useState(0);
	const [items, setItems] = useState<FeedItem[]>([]);
	const [mode, setMode] = useState("");
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const t = titleLabels[locale];
	const reload = useCallback(async (signal: AbortSignal) => {
		try {
			const next = await fetchNews(signal);
			if (signal.aborted) return;
			setItems(next.items);
			setFetchedAt(Date.now());
			setMode(next.mode);
			setStatus(
				next.items.length || next.mode.includes("Langfuse") ? "ready" : "error",
			);
		} catch {
			if (!signal.aborted) setStatus("error");
		}
	}, []);
	useEffect(() => {
		const controller = new AbortController();
		const initial = window.setTimeout(() => void reload(controller.signal), 0);
		return () => {
			controller.abort();
			window.clearTimeout(initial);
		};
	}, [reload]);
	const digest = useMemo(() => selectCtidDigest(items), [items]);
	const visible = useMemo(() => filterNews([...digest.homelab, ...digest.global, ...digest.other], filters, fetchedAt), [digest, filters, fetchedAt]);
	if (status === "loading") return <p role="status">{t.load}</p>;
	if (status === "error")
		return (
			<div role="alert">
				<p>{t.empty}</p>
				<button
					type="button"
					onClick={() => {
						const controller = new AbortController();
						setStatus("loading");
						void reload(controller.signal);
					}}
				>
					{t.retry}
				</button>
			</div>
		);
	return (
		<div className={styles.digest}>
			<p className={styles.notice}>
				{t.evidence} · {mode} · {copy.refreshed}{" "}
				{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(fetchedAt)}
			</p>
			<CtidFilters locale={locale} copy={copy} filters={filters} setFilters={setFilters} />
			<p role="status">{visible.length} {copy.results}</p>
			{visible.length === 0 && <p>{t.empty}</p>}
			<div className={styles.grid}>
				{visible.map((item, index) => (
					<CtidCard key={item.link} item={item} locale={locale} featured={index < 10} copy={copy} />
				))}
			</div>
		</div>
	);
}
