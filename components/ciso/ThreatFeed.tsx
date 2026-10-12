"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
	type FeedItem,
	normalizeArticle,
	rankArticles,
} from "@/lib/cisoThreatFeed";

const FEEDS_CONFIG_URL = "/ciso-rss-feeds.json";
const FEED_CONCURRENCY = 4;
const MAX_FALLBACK_FEEDS = 16;
const MAX_VISIBLE_ITEMS = 60;

type Labels = {
	loading?: string;
	error?: string;
	retry?: string;
	opensInNewTab?: string;
};

function safeFeedUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && !url.username && !url.password
			? url.href
			: null;
	} catch {
		return null;
	}
}

async function loadFeedUrls(signal?: AbortSignal): Promise<string[]> {
	const response = await fetch(FEEDS_CONFIG_URL, { signal });
	if (!response.ok) throw new Error("RSS configuration unavailable");
	const data = (await response.json()) as { feeds?: unknown };
	if (!Array.isArray(data.feeds)) throw new Error("No RSS feeds");
	return Array.from(
		new Set(data.feeds.flatMap((value) => safeFeedUrl(value) ?? [])),
	).slice(0, MAX_FALLBACK_FEEDS);
}

async function fetchPublicFeed(
	feedUrl: string,
	signal?: AbortSignal,
): Promise<FeedItem[]> {
	const endpoint =
		"https://api.rss2json.com/v1/api.json?rss_url=" +
		encodeURIComponent(feedUrl);
	const response = await fetch(endpoint, { signal });
	if (!response.ok) throw new Error("RSS proxy unavailable");
	const data = (await response.json()) as {
		feed?: { title?: string };
		items?: Array<{
			link?: string;
			title?: string;
			description?: string;
			pubDate?: string;
		}>;
	};
	return (data.items ?? []).slice(0, 4).flatMap((raw) => {
		const item = normalizeArticle({
			link: raw.link,
			title: raw.title,
			source: data.feed?.title ?? new URL(feedUrl).hostname,
			pubDate: raw.pubDate,
			summary: raw.description,
		});
		return item ? [item] : [];
	});
}

async function fetchFallback(signal?: AbortSignal): Promise<FeedItem[]> {
	const urls = await loadFeedUrls(signal);
	const collected: FeedItem[] = [];
	let next = 0;
	async function worker() {
		while (!signal?.aborted) {
			const index = next++;
			if (index >= urls.length) return;
			try {
				collected.push(...(await fetchPublicFeed(urls[index], signal)));
			} catch {
				// Individual feeds may be stale or rate-limited.
			}
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(FEED_CONCURRENCY, urls.length) }, () =>
			worker(),
		),
	);
	return collected;
}

function formattedDate(value: string | undefined, locale: "fr" | "en") {
	if (!value) return null;
	const time = Date.parse(value);
	if (!Number.isFinite(time)) return null;
	return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(time);
}

export default function ThreatFeed({
	locale,
	labels = {},
}: {
	locale: "en" | "fr";
	labels?: Labels;
}) {
	const [items, setItems] = useState<FeedItem[]>([]);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [mode, setMode] = useState<"freshrss" | "fallback">("fallback");
	const [query, setQuery] = useState("");
	const [technology, setTechnology] = useState("");
	const [scope, setScope] = useState<"stack" | "all">("stack");
	const [order, setOrder] = useState<"relevance" | "newest">("relevance");

	const fr = locale === "fr";
	const strings = {
		loading:
			labels.loading ??
			(fr ? "Chargement de la veille cyber…" : "Loading threat intelligence…"),
		error:
			labels.error ??
			(fr
				? "Les flux sont temporairement indisponibles."
				: "Threat feeds are temporarily unavailable."),
		retry: labels.retry ?? (fr ? "Réessayer" : "Retry"),
		opensInNewTab:
			labels.opensInNewTab ?? (fr ? "nouvel onglet" : "opens in a new tab"),
		scope: fr ? "Pertinent pour la stack" : "Relevant to the stack",
		all: fr ? "Tous les articles" : "All articles",
		search: fr
			? "Rechercher un article ou une technologie"
			: "Search articles or technologies",
		tech: fr ? "Toutes les technologies" : "All technologies",
		relevance: fr ? "Pertinence" : "Relevance",
		latest: fr ? "Plus récents" : "Newest first",
		order: fr ? "Trier par" : "Sort by",
		matches: fr ? "Technologies mentionnées" : "Technologies mentioned",
		urgent: fr ? "À examiner" : "Review",
		note: fr
			? "Correspondance lexicale avec le catalogue Nabla, non preuve d'exposition ou de vulnérabilité. Vérifier versions, CVE et actifs avant toute action."
			: "Keyword match against Nabla's catalogue, not evidence of exposure or vulnerability. Verify versions, CVEs and assets before acting.",
		empty: fr
			? "Aucun résultat pour ces filtres."
			: "No results with these filters.",
		fallback: fr
			? "Sources publiques de secours · couverture limitée"
			: "Public-feed fallback · limited coverage",
		freshrss: "FreshRSS · Google Reader API",
		reset: fr ? "Effacer les filtres" : "Clear filters",
		results: fr ? "articles affichés" : "articles shown",
	};

	const loadFeeds = useCallback(async (signal?: AbortSignal) => {
		try {
			let nextItems: FeedItem[] = [];
			let nextMode: "freshrss" | "fallback" = "fallback";
			try {
				const response = await fetch("/api/ciso/threat-feed", { signal });
				if (!response.ok) throw new Error("FreshRSS unavailable");
				const payload = (await response.json()) as { items?: FeedItem[] };
				if (!Array.isArray(payload.items))
					throw new Error("Invalid FreshRSS response");
				nextItems = payload.items;
				nextMode = "freshrss";
			} catch {
				if (signal?.aborted) return;
				nextItems = await fetchFallback(signal);
			}
			if (signal?.aborted) return;
			setItems(nextItems);
			setMode(nextMode);
			setStatus(nextItems.length ? "ready" : "error");
		} catch {
			if (!signal?.aborted) setStatus("error");
		}
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		const initialLoad = window.setTimeout(
			() => void loadFeeds(controller.signal),
			0,
		);
		const refresh = window.setInterval(
			() => void loadFeeds(controller.signal),
			600_000,
		);
		return () => {
			controller.abort();
			window.clearTimeout(initialLoad);
			window.clearInterval(refresh);
		};
	}, [loadFeeds]);

	const ranked = useMemo(() => rankArticles(items), [items]);
	const technologies = useMemo(
		() =>
			Array.from(new Set(ranked.flatMap((item) => item.technologies))).sort(),
		[ranked],
	);
	const displayed = useMemo(() => {
		const needle = query.trim().toLocaleLowerCase(locale);
		const filtered = ranked.filter((item) => {
			if (scope === "stack" && item.technologies.length === 0) return false;
			if (technology && !item.technologies.includes(technology)) return false;
			return (
				!needle ||
				[item.title, item.summary ?? "", item.source, ...item.technologies]
					.join(" ")
					.toLocaleLowerCase(locale)
					.includes(needle)
			);
		});
		if (order === "newest") {
			filtered.sort(
				(a, b) =>
					(Date.parse(b.pubDate ?? "") || 0) -
					(Date.parse(a.pubDate ?? "") || 0),
			);
		}
		return filtered.slice(0, MAX_VISIBLE_ITEMS);
	}, [ranked, scope, technology, query, order, locale]);

	if (status === "loading" && !items.length) {
		return (
			<p className="ciso-feed-status" role="status">
				{strings.loading}
			</p>
		);
	}
	if (status === "error" && !items.length) {
		return (
			<div className="ciso-feed-status" role="alert">
				<p>{strings.error}</p>
				<Button
					size="compact"
					variant="outline"
					onClick={() => {
						setStatus("loading");
						void loadFeeds();
					}}
				>
					{strings.retry}
				</Button>
			</div>
		);
	}

	return (
		<div className="ciso-feed">
			<div className="ciso-feed-toolbar">
				<div
					className="ciso-feed-tabs"
					role="group"
					aria-label={fr ? "Étendue de la veille" : "Threat feed scope"}
				>
					<button
						type="button"
						aria-pressed={scope === "stack"}
						className={scope === "stack" ? "is-active" : ""}
						onClick={() => setScope("stack")}
					>
						{strings.scope}
					</button>
					<button
						type="button"
						aria-pressed={scope === "all"}
						className={scope === "all" ? "is-active" : ""}
						onClick={() => setScope("all")}
					>
						{strings.all}
					</button>
				</div>
				<div className="ciso-feed-filters">
					<label>
						<span className="visually-hidden">{strings.search}</span>
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={strings.search}
						/>
					</label>
					<label>
						<span className="visually-hidden">{strings.tech}</span>
						<select
							value={technology}
							onChange={(event) => setTechnology(event.target.value)}
						>
							<option value="">{strings.tech}</option>
							{technologies.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
					</label>
					<label>
						<span className="visually-hidden">{strings.order}</span>
						<select
							value={order}
							onChange={(event) => {
								const nextOrder = event.target.value;
								if (nextOrder === "newest" || nextOrder === "relevance") {
									setOrder(nextOrder);
								}
							}}
						>
							<option value="relevance">{strings.relevance}</option>
							<option value="newest">{strings.latest}</option>
						</select>
					</label>
				</div>
			</div>
			<div className="ciso-feed-overview" role="status" aria-live="polite">
				<span>
					<strong>{displayed.length}</strong> {strings.results} /{" "}
					{ranked.length}
				</span>
				<span>{mode === "freshrss" ? strings.freshrss : strings.fallback}</span>
			</div>
			<p className="ciso-feed-disclaimer">{strings.note}</p>
			{displayed.length ? (
				<div className="ciso-feed-list">
					{displayed.map((item) => (
						<article className="ciso-feed-item" key={item.link}>
							<div className="ciso-feed-meta">
								<span>
									<i className="fa-solid fa-rss" aria-hidden="true" />{" "}
									{item.source}
								</span>
								{item.pubDate && (
									<time dateTime={item.pubDate}>
										{formattedDate(item.pubDate, locale)}
									</time>
								)}
							</div>
							<h3>
								<a href={item.link} target="_blank" rel="noopener noreferrer">
									{item.title}
									<span className="visually-hidden">
										{" "}
										({strings.opensInNewTab})
									</span>
									<i
										className="fa-solid fa-arrow-up-right-from-square"
										aria-hidden="true"
									/>
								</a>
							</h3>
							{item.summary && (
								<p className="ciso-feed-summary">{item.summary}</p>
							)}
							{item.technologies.length > 0 && (
								<div className="ciso-feed-tags" aria-label={strings.matches}>
									{item.technologies.slice(0, 4).map((name) => (
										<span key={name} className="ciso-feed-tag">
											{name}
										</span>
									))}
									{item.technologies.length > 4 && (
										<span className="ciso-feed-tag">
											+{item.technologies.length - 4}
										</span>
									)}
								</div>
							)}
							{item.urgent && (
								<span className="ciso-feed-review">{strings.urgent}</span>
							)}
						</article>
					))}
				</div>
			) : (
				<div className="ciso-feed-empty">
					<p>{strings.empty}</p>
					<button
						type="button"
						onClick={() => {
							setScope("all");
							setQuery("");
							setTechnology("");
						}}
					>
						{strings.reset}
					</button>
				</div>
			)}
		</div>
	);
}
