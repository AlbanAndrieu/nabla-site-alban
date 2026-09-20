import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const WORKSTATION_COMPONENTS = [
	"app/components/workstation/WorkstationHero.tsx",
	"app/components/workstation/WorkstationServiceSections.tsx",
	"app/components/workstation/HardwareSection.tsx",
	"app/components/workstation/BillOfMaterialsSection.tsx",
] as const;

function leafKeys(value: unknown, prefix = ""): string[] {
	if (!value || typeof value !== "object" || Array.isArray(value))
		return [prefix];
	return Object.entries(value as Record<string, unknown>).flatMap(
		([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key),
	);
}

test("workstation is native Next.js with a locale-parity feature catalog", async () => {
	const [
		loader,
		page,
		data,
		globalNotFound,
		globals,
		actionStyles,
		designTokens,
		layoutStyles,
		enRaw,
		frRaw,
		...components
	] = await Promise.all([
		readFile("i18n/messages.ts", "utf8"),
		readFile("app/[locale]/workstation/page.tsx", "utf8"),
		readFile("app/components/workstation/workstationServices.ts", "utf8"),
		readFile("app/global-not-found.tsx", "utf8"),
		readFile("app/globals.css", "utf8"),
		readFile("components/ui/Action.module.css", "utf8"),
		readFile("app/design-tokens.css", "utf8"),
		readFile("app/components/workstation/WorkstationLayout.module.css", "utf8"),
		readFile("messages/workstation/en.json", "utf8"),
		readFile("messages/workstation/fr.json", "utf8"),
		...WORKSTATION_COMPONENTS.map((path) => readFile(path, "utf8")),
	]);

	assert.match(loader, /WORKSTATION_LOADERS/);
	assert.match(loader, /\.\.\.workstation/);
	assert.match(page, /<WorkstationHero truenasHref=\{truenasHref\} \/>/);
	assert.match(page, /<WorkstationServiceSections/);
	assert.doesNotMatch(page, /PublicHtmlFragment/);
	assert.doesNotMatch(page, /metadataFromPublicHtml/);
	assert.match(page, /NON_INDEXABLE_ROBOTS/);
	assert.match(page, /workstation\.html/);
	assert.match(page, /WorkstationLayout\.module\.css/);
	assert.match(page, /className=\{styles\.pageMain\}/);
	assert.doesNotMatch(
		page,
		/className=(?:["'][^"']*\b(?:mb-5|py-5|container|row|col-[\w-]+)\b[^"']*["']|\{`[^`]*\b(?:mb-5|py-5|container|row|col-[\w-]+)\b[^`]*`\})/,
	);

	for (const component of components) {
		assert.match(component, /getTranslations/);
		assert.match(component, /components\/ui\/Container/);
		assert.doesNotMatch(component, /className=["']container["']/);
		assert.doesNotMatch(component, /locale === ["']fr["']/);
		assert.doesNotMatch(component, /const COPY\b/);
	}

	const [hero, serviceSections, hardware, billOfMaterials] = components;
	for (const source of [hardware, billOfMaterials]) {
		assert.match(source, /WorkstationLayout\.module\.css/);
		assert.doesNotMatch(
			source,
			/\b(?:row|col-(?:12|lg-8)|justify-content-center|card-body|card-text|list-group|list-group-flush|list-group-item|mb-0|mb-2|mb-3|mb-4|mt-3|mt-4|me-2|text-primary|text-muted|display-4)\b/,
		);
		assert.doesNotMatch(
			source,
			/className=(?:["'][^"']*\b(?:h4|h5|h6)\b[^"']*["']|\{`[^`]*\b(?:h4|h5|h6)\b[^`]*`\})/,
		);
	}
	assert.match(hardware, /components\/ui\/Card/);
	assert.match(hardware, /components\/ui\/Container/);
	assert.match(billOfMaterials, /components\/ui\/ExternalLink/);
	assert.match(layoutStyles, /\.hardwareBand/);
	assert.match(layoutStyles, /\.bomList/);
	assert.match(layoutStyles, /\.bomItem/);
	assert.match(layoutStyles, /\.pageMain/);
	assert.match(layoutStyles, /var\(--ui-space-2xl\)/);
	assert.match(designTokens, /--ui-space-2xl:/);

	for (const source of [hero, serviceSections]) {
		assert.match(source, /components\/ui\/Card/);
		assert.match(source, /WorkstationLayout\.module\.css/);
		assert.doesNotMatch(source, /\bcard-(?:body|title|text)\b/);
		assert.doesNotMatch(source, /\bbtn(?:-[\w-]+)?\b/);
		assert.match(source, /data-ui-action/);
		assert.doesNotMatch(
			source,
			/\b(?:row|col-(?:12|lg-6|md-4|md-6)|p-3|g-4|d-flex|flex-column|flex-grow-1|justify-content-between|align-items-center|gap-2|align-self-start|h-100|py-5|bg-light|border-top|border-secondary)\b/,
		);
		assert.doesNotMatch(
			source,
			/\b(?:display-4|text-secondary|text-muted|text-primary|mb-0|mb-3|mb-4|mt-3|me-2)\b/,
		);
		assert.doesNotMatch(
			source,
			/className=(?:["'][^"']*\b(?:lead|h3|h5|h6)\b[^"']*["']|\{`[^`]*\b(?:lead|h3|h5|h6)\b[^`]*`\})/,
		);
	}
	assert.match(hero, /actionClassName/);
	assert.match(hero, /styles\.heroSection/);
	assert.match(hero, /styles\.heroGrid/);
	assert.match(serviceSections, /components\/ui\/ActionLink/);
	assert.match(serviceSections, /components\/ui\/Button/);
	assert.match(serviceSections, /styles\.section/);
	assert.match(serviceSections, /styles\.relatedSection/);
	assert.match(serviceSections, /styles\.serviceGrid/);
	assert.match(serviceSections, /styles\.relatedGrid/);
	assert.match(serviceSections, /styles\.actionRow/);
	assert.match(layoutStyles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
	assert.match(layoutStyles, /@media \(max-width: 991\.98px\)/);
	assert.match(layoutStyles, /@media \(max-width: 767\.98px\)/);
	assert.match(designTokens, /--ui-font-size-display:/);
	assert.match(designTokens, /--ui-font-size-section-title:/);
	assert.match(designTokens, /--ui-font-size-lg:/);
	assert.match(designTokens, /--ui-font-size-sm:/);
	assert.match(layoutStyles, /var\(--ui-font-size-display\)/);
	assert.match(layoutStyles, /var\(--ui-font-size-section-title\)/);
	assert.match(
		globals,
		/\.page-truenas a:not\(\.btn\):not\(\[data-ui-action\]\)/,
	);
	assert.match(actionStyles, /\.action:disabled/);

	for (const productName of [
		"Traefik",
		"Dockge",
		"Prometheus",
		"Watchtower",
		"LiteLLM",
		"PgBouncer",
		"NetAlertX",
	]) {
		assert.match(data, new RegExp(`name: "${productName}"`));
	}

	assert.match(globalNotFound, /loadPublicHtmlFragment/);
	assert.match(globalNotFound, /404\.html/);
	await assert.rejects(access("app/components/PublicHtmlFragment.tsx"));

	const en = JSON.parse(enRaw) as { workstation: unknown };
	const fr = JSON.parse(frRaw) as { workstation: unknown };
	assert.deepEqual(
		leafKeys(en.workstation).sort(),
		leafKeys(fr.workstation).sort(),
	);
});
