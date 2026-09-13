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
	const [loader, page, data, globalNotFound, enRaw, frRaw, ...components] =
		await Promise.all([
			readFile("i18n/messages.ts", "utf8"),
			readFile("app/[locale]/workstation/page.tsx", "utf8"),
			readFile("app/components/workstation/workstationServices.ts", "utf8"),
			readFile("app/global-not-found.tsx", "utf8"),
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

	for (const component of components) {
		assert.match(component, /getTranslations/);
		assert.doesNotMatch(component, /locale === [#']fr[#']/);
		assert.doesNotMatch(component, /const COPY\b/);
	}

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
