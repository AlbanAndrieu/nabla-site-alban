import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (file: string) =>
	readFile(
		new URL("../app/[locale]/architecture/" + file, import.meta.url),
		"utf8",
	);

test("private architecture error is actionable, accessible and localized", async () => {
	const [view, notice, css] = await Promise.all([
		source("ArchitecturePrivateViews.tsx"),
		source("ArchitectureCatalogNotice.tsx"),
		source("ArchitectureCatalogNotice.module.css"),
	]);
	assert.match(view, /fetchJson\("\/api\/homelab-catalog-v2"/);
	assert.match(view, /controller\.abort\(\)/);
	assert.match(view, /setAttempt\(\(current\) => current \+ 1\)/);
	assert.match(view, /if \(!trusted\) return null/);
	assert.match(view, /if \(status === "loading"/);
	assert.match(notice, /role="alert"/);
	assert.match(notice, /data-architecture-catalog-v2-unavailable/);
	assert.match(
		notice,
		/aria-labelledby="architecture-catalog-unavailable-title"/,
	);
	assert.match(notice, /data-catalog-failure-reason=\{reason\}/);
	assert.match(notice, /Réessayer le chargement/);
	assert.match(notice, /Try loading again/);
	assert.match(notice, /Cela ne signifie pas que les services sont arrêtés/);
	assert.match(notice, /This does not mean the services are down/);
	assert.match(notice, /type="button" onClick=\{onRetry\}/);
	assert.match(notice, /"key-missing"/);
	assert.match(notice, /"access-denied"/);
	assert.doesNotMatch(notice, /NEXT_PUBLIC_|process\.env|https:\/\/\S*fastapi/);
	assert.doesNotMatch(
		view,
		/getStaticHomelabServicesCatalog|getStaticServiceTopology/,
	);
	assert.match(css, /prefers-reduced-motion/);
	assert.match(css, /focus-visible/);
	assert.match(css, /max-width: 575\.98px/);
});
