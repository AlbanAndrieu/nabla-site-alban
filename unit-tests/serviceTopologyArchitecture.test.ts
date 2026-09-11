import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getStaticServiceTopology } from "../lib/serviceTopology";

test("static architecture topology never probes FastAPI during prerender", () => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = (async () => {
		fetchCalled = true;
		throw new Error("static topology must not fetch");
	}) as typeof fetch;

	try {
		const result = getStaticServiceTopology();
		assert.equal(fetchCalled, false);
		assert.equal(result.source, "local-fallback");
		assert.ok(result.topology.nodes.length >= 10);
		assert.ok(result.topology.relations.length >= 10);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("architecture route uses a static declared shell with live shared service health indicators", async () => {
	const [page, explorer, data, css, packageJson] = await Promise.all([
		readFile("app/[locale]/architecture/page.tsx", "utf8"),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
			"utf8",
		),
		readFile("app/[locale]/architecture/architectureData.ts", "utf8"),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css",
			"utf8",
		),
		readFile("package.json", "utf8"),
	]);

	assert.match(page, /buildPageMetadata\(/);
	assert.match(page, /slug: "architecture"/);
	assert.match(page, /getStaticHomelabServicesCatalog\(\)/);
	assert.match(page, /getStaticServiceTopology\(\)/);
	assert.doesNotMatch(page, /loadHomelabServicesCatalog\(\)/);
	assert.doesNotMatch(page, /loadServiceTopology\(\)/);
	assert.match(explorer, /from "@xyflow\/react"/);
	assert.match(explorer, /colorMode="dark"/);
	assert.match(explorer, /<MiniMap[\s\S]*nodeColor=\{\(node\) =>/);
	assert.match(explorer, /homelabHealthColor\(data\.healthState\)/);
	assert.match(explorer, /: "#38bdf8"/);
	assert.match(
		explorer,
		/<Controls className=\{styles\.flowControls\} showInteractive=\{false\} \/>/,
	);
	assert.match(explorer, /iconSrc: entity\.iconSrc/);
	assert.match(explorer, /nodeIconFallback/);
	assert.match(explorer, /className="fas fa-lock"/);
	assert.match(explorer, /className="fas fa-cloud"/);
	assert.match(explorer, /className="fas fa-skull-crossbones"/);
	assert.match(explorer, /health\?\.url \?\? entity\.url/);
	assert.match(explorer, /parseHomelabHealthSnapshot/);
	assert.match(data, /iconSrc: serviceIconSrc\(service\)/);
	assert.match(css, /background: #020617/);
	assert.match(css, /\.nodeIconFrame/);
	assert.match(packageJson, /"@xyflow\/react": "12\.11\.3"/);
	for (const product of [
		"Open WebUI",
		"LiteLLM",
		"Ollama",
		"Paperless-ngx",
		"OpenRAG",
		"Langfuse",
	]) {
		assert.match(
			data,
			new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
		);
	}
});

test("architecture keeps one standalone compact mobile hierarchy beside the desktop graph", async () => {
	const [view, explorer, mobile, mobileCss, explorerCss] = await Promise.all([
		readFile("app/[locale]/architecture/ArchitectureTopologyView.tsx", "utf8"),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx",
			"utf8",
		),
		readFile(
			"app/[locale]/architecture/MobileArchitectureHierarchy.tsx",
			"utf8",
		),
		readFile(
			"app/[locale]/architecture/MobileArchitectureHierarchy.module.css",
			"utf8",
		),
		readFile(
			"app/[locale]/architecture/HierarchicalArchitectureExplorer.module.css",
			"utf8",
		),
	]);

	assert.match(view, /<MobileArchitectureHierarchy/);
	assert.match(view, /catalog=\{filteredCatalog\}/);
	assert.match(view, /topology=\{topology\}/);
	assert.match(view, /snapshot=\{health\}/);
	assert.match(view, /<HierarchicalArchitectureExplorer/);
	assert.match(mobile, /data-mobile-architecture-hierarchy/);
	assert.match(mobile, /analyzeServiceCriticality\(topology\)/);
	assert.match(mobile, /resolveEffectiveServiceState/);
	assert.match(mobile, /blockedDependencyLabels\(health\)/);
	assert.match(mobile, /data-mobile-criticality-tier=\{group\.tier\}/);
	assert.match(mobile, /data-mobile-service=\{id\}/);
	assert.match(mobile, /itemCriticality\?\.transitiveDependents/);
	assert.match(mobile, /showOptional \|\| relation\.strength === "required"/);
	assert.doesNotMatch(explorer, /data-mobile-architecture-hierarchy/);
	assert.match(explorer, /if \(document\.hidden\) return/);
	assert.match(explorer, /document\.addEventListener\("visibilitychange"/);
	assert.match(explorer, /document\.removeEventListener\("visibilitychange"/);
	assert.match(explorer, /maxBlastRadius = Math\.max/);
	assert.match(explorer, /blastRatio >= 0\.5/);
	assert.match(explorer, /blastRatio >= 0\.05/);
	assert.match(explorer, /data-blast-radius-level=\{item\.blastRadiusLevel\}/);
	assert.match(mobileCss, /\.mobileHierarchy\s*\{[\s\S]*display:\s*none/);
	assert.match(
		mobileCss,
		/@media \(max-width: 700px\)[\s\S]*\.mobileHierarchy\s*\{[\s\S]*display:\s*grid/,
	);
	assert.match(explorerCss, /\.node\[data-blast-radius-level="dominant"\]/);
	assert.match(
		explorerCss,
		/@media \(max-width: 700px\)[\s\S]*\.flowShell\s*\{[\s\S]*display:\s*none/,
	);
	assert.match(
		explorerCss,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*react-flow__edge\.animated path[\s\S]*animation:\s*none !important/,
	);
});
