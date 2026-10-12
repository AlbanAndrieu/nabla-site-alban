import { rankArticles } from "@/lib/cisoThreatFeed";
import { fetchFreshRssPublicArticles } from "@/lib/server/freshRssPublic";

export const runtime = "nodejs";

function xml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[character] ?? character,
	);
}

/** Public RSS digest: at most ten actual, date-stamped security headlines. */
export async function GET() {
	try {
		const articles = await fetchFreshRssPublicArticles();
		if (!articles)
			return new Response("Security RSS not configured", {
				status: 503,
				headers: { "Cache-Control": "no-store" },
			});
		const top = rankArticles(articles).slice(0, 10);
		const xmlItems = top
			.map(
				(article) => `
			<item>
				<title>${xml(article.title)}</title>
				<link>${xml(article.link)}</link>
				<guid isPermaLink="true">${xml(article.link)}</guid>
				<description>${xml(article.summary || article.title)}</description>
				<category>${article.technologies.length ? "Stack signal" : "Global security"}</category>
				${article.pubDate ? `<pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>` : ""}
			</item>`,
			)
			.join("");
		const content = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Nabla — sélection de veille cybersécurité</title>
<link>https://albanandrieu.com/ctid</link>
<description>Dix articles de veille sélectionnés, classés selon leur pertinence; aucune vulnérabilité confirmée.</description>
<language>fr</language>
<atom:link href="https://albanandrieu.com/security-feed.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlItems}
</channel></rss>`;
		return new Response(content, {
			headers: {
				"Content-Type": "application/rss+xml; charset=utf-8",
				"Cache-Control": "public, max-age=0, s-maxage=600",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch {
		return new Response("Security RSS temporarily unavailable", {
			status: 503,
			headers: { "Cache-Control": "no-store" },
		});
	}
}
