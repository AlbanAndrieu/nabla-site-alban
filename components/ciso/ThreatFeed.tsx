"use client";

import { useCallback, useEffect, useState } from "react";

const FEEDS = [
	"https://www.bleepingcomputer.com/feed/",
	"https://krebsonsecurity.com/feed/",
	"https://www.securityweek.com/rss",
	"https://feeds.feedburner.com/TheHackersNews",
	"https://www.tenable.com/blog/feed",
	"https://blog.rapid7.com/rss/",
] as const;

type FeedItem = {
	link: string;
	pubDate?: string;
	source: string;
	title: string;
};

function safeExternalUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : null;
	} catch {
		return null;
	}
}

function formatFeedDate(value: string | undefined, locale: "en" | "fr") {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;

	return {
		dateTime: date.toISOString(),
		label: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
			date,
		),
	};
}

export default function ThreatFeed({ locale }: { locale: "en" | "fr" }) {
	const [items, setItems] = useState<FeedItem[]>([]);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);

	const loadFeeds = useCallback(async (signal?: AbortSignal) => {
		setStatus("loading");
		const responses = await Promise.allSettled(
			FEEDS.map(async (feedUrl) => {
				const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
				const response = await fetch(endpoint, { signal });
				if (!response.ok)
					throw new Error(`RSS request failed: ${response.status}`);
				const data = (await response.json()) as {
					feed?: { title?: string };
					items?: Array<{ link?: unknown; pubDate?: string; title?: string }>;
				};
				return (data.items ?? []).slice(0, 2).flatMap((item) => {
					const link = safeExternalUrl(item.link);
					if (!link || !item.title) return [];
					return [
						{
							link,
							pubDate: item.pubDate,
							source: data.feed?.title ?? new URL(feedUrl).hostname,
							title: item.title,
						},
					];
				});
			}),
		);
		if (signal?.aborted) return;
		const nextItems = responses.flatMap((result) =>
			result.status === "fulfilled" ? result.value : [],
		);
		setItems(nextItems);
		setStatus(nextItems.length ? "ready" : "error");
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		void loadFeeds(controller.signal);
		const refresh = window.setInterval(
			() => void loadFeeds(controller.signal),
			600_000,
		);
		return () => {
			controller.abort();
			window.clearInterval(refresh);
		};
	}, [loadFeeds]);

	if (status === "loading" && !items.length) {
		return (
			<p className="ciso-feed-status" role="status">
				{locale === "fr"
					? "Chargement des actualités de sécurité…"
					: "Loading security news…"}
			</p>
		);
	}
	if (status === "error") {
		return (
			<div className="ciso-feed-status" role="alert">
				<p>
					{locale === "fr"
						? "Les flux sont temporairement indisponibles."
						: "Threat feeds are temporarily unavailable."}
				</p>
				<button
					className="btn btn-outline-primary btn-sm"
					type="button"
					onClick={() => void loadFeeds()}
				>
					{locale === "fr" ? "Réessayer" : "Retry"}
				</button>
			</div>
		);
	}

	return (
		<div className="ciso-feed-list">
			{items.map((item) => {
				const date = formatFeedDate(item.pubDate, locale);
				return (
					<article
						className="ciso-feed-item"
						key={`${item.source}-${item.link}`}
					>
						<p className="ciso-feed-meta">
							<i className="fa-solid fa-rss" aria-hidden="true" /> {item.source}
							{date ? (
								<>
									{" "}
									· <time dateTime={date.dateTime}>{date.label}</time>
								</>
							) : null}
						</p>
						<h3>
							<a href={item.link} target="_blank" rel="noopener noreferrer">
								{item.title}
								<span className="visually-hidden">
									({locale === "fr" ? "nouvel onglet" : "opens in a new tab"})
								</span>
							</a>
						</h3>
					</article>
				);
			})}
		</div>
	);
}
