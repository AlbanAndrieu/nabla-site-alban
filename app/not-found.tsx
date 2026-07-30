import type { Metadata } from "next";

import "./globals.css";

import sanitizeHtml from "sanitize-html";
import { loadPublicHtmlFragment } from "@/lib/htmlFromPublic";

export const metadata: Metadata = {
	title: "404 - Page not found | Alban Andrieu",
	description:
		"The page you are looking for could not be found. Return to the homepage.",
	icons: { icon: "/favicon.ico" },
};

export default async function GlobalNotFound() {
	const staticBody = await loadPublicHtmlFragment("404.html", "body", "en");
	const staticMarkup = sanitizeHtml(staticBody, {
		allowedTags: sanitizeHtml.defaults.allowedTags,
		allowedAttributes: false,
	});

	return (
		<html
			lang="en"
			data-nabla-app="next-global-not-found"
			suppressHydrationWarning
		>
			<body className="page-dark">
				<div
					style={{ display: "contents" }}
					dangerouslySetInnerHTML={{ __html: staticMarkup }}
				/>
				<script src="/site-analytics.js" data-analytics-mode="vercel" defer />
				<script src="/site-widgets.js" data-minimal-chrome="" defer />
			</body>
		</html>
	);
}
