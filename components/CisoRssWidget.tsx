// components/CisoRssWidget.tsx

"use client";
import { useEffect, useState } from "react";

const feeds = [
	{
		label: "The Hacker News",
		url: "https://feeds.feedburner.com/TheHackersNews",
	},
	{
		label: "US-CERT Alerts",
		url: "https://www.us-cert.gov/ncas/alerts.xml",
	},
	{
		label: "Dark Reading",
		url: "https://www.darkreading.com/rss.xml",
	},
	{
		label: "ThreatPost",
		url: "https://threatpost.com/feed/",
	},
];

async function fetchRssFeed(rssUrl: string): Promise<any[]> {
	// Proxy via rss2json API
	const resp = await fetch(
		`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
	);
	const data = await resp.json();
	return Array.isArray(data.items) ? data.items.slice(0, 2) : [];
}

export function CisoRssWidget({ isFr }: { isFr: boolean }) {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			const allItems: any[] = [];
			for (const feed of feeds) {
				try {
					const articles = await fetchRssFeed(feed.url);
					allItems.push(
						...articles.map((item: any) => ({
							...item,
							source: feed.label,
						})),
					);
				} catch {}
			}
			if (mounted) {
				setItems(allItems);
				setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	if (loading) {
		return (
			<div style={{ textAlign: "center", color: "#1957e0" }}>
				{isFr
					? "Chargement des dernières actualités cybersécurité…"
					: "Loading latest cybersecurity news…"}
			</div>
		);
	}
	if (!items.length) {
		return (
			<div style={{ textAlign: "center", color: "#f55" }}>
				{isFr
					? "Aucune actualité RSS disponible (quota API ou réseaux)."
					: "No RSS news available (maybe API quota/network)."}
			</div>
		);
	}
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: "1.3rem",
				justifyContent: "center",
			}}
		>
			{items.slice(0, 6).map((item, i) => (
				<div
					key={item.guid || item.link || i}
					className="resource-card"
					style={{
						minWidth: 280,
						maxWidth: 350,
						background: "#f2f6f9",
					}}
				>
					<h4 style={{ margin: "7px 0" }}>
						<a
							href={item.link}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: "#1957e0" }}
						>
							{item.title}
						</a>
					</h4>
					<p style={{ fontSize: "0.98em", lineHeight: 1.35, minHeight: 36 }}>
						{item.description
							? item.description.length > 140
								? item.description.slice(0, 140) + "…"
								: item.description
							: ""}
					</p>
					<div style={{ opacity: 0.7, fontSize: "0.93em", marginTop: 8 }}>
						{isFr ? "Source" : "Source"}:{" "}
						<span style={{ color: "#2d396b" }}>{item.source}</span>
					</div>
				</div>
			))}
		</div>
	);
}

export default CisoRssWidget;
