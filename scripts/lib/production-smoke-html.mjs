/** Pure HTML metadata inspection for the production smoke (no network requests). */

function attributeValue(tag, name) {
	const match = tag.match(
		new RegExp("\\b" + name + "=[\"']([^\"']+)[\"']", "i"),
	);
	return match?.[1] ?? null;
}

const HTML_ATTRIBUTE_ENTITY_PATTERN =
	/&(amp|quot|#0*(?:34|38)|#x0*(?:22|26));/gi;

export function decodeHtmlAttributeValue(value) {
	return value.replace(HTML_ATTRIBUTE_ENTITY_PATTERN, (_entity, code) => {
		const normalized = String(code).toLowerCase();
		const isAmpersand =
			normalized === "amp" ||
			normalized.endsWith("38") ||
			normalized.endsWith("26");
		return isAmpersand ? "&" : '"';
	});
}

function linkHref(html, rel, hreflang) {
	const tags = html.match(/<link\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		const relValue = attributeValue(tag, "rel");
		if (!relValue || !relValue.split(/\s+/).includes(rel)) continue;
		if (hreflang) {
			const lang = attributeValue(tag, "hreflang");
			if (!lang || lang.toLowerCase() !== hreflang.toLowerCase()) continue;
		}
		const href = attributeValue(tag, "href");
		if (href) return decodeHtmlAttributeValue(href);
	}
	return null;
}

function metaContent(html, name) {
	const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		const metaName =
			attributeValue(tag, "property") ?? attributeValue(tag, "name");
		if (!metaName || metaName.toLowerCase() !== name.toLowerCase()) continue;
		const content = attributeValue(tag, "content");
		if (content) return decodeHtmlAttributeValue(content);
	}
	return null;
}
