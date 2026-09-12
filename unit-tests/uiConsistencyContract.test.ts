import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("major TrueNAS and architecture sections share the anchored blue heading contract", async () => {
	const [
		sectionHeading,
		sectionHeadingCss,
		hardware,
		homelab,
		services,
		architecture,
		architectureCss,
	] = await Promise.all([
		source("components/SectionHeading.tsx"),
		source("components/SectionHeading.module.css"),
		source("app/components/truenas/HardwareSection.tsx"),
		source("app/components/truenas/HomeLabSection.tsx"),
		source("app/components/homelab/HomelabServicesSection.tsx"),
		source("app/[locale]/architecture/page.tsx"),
		source("app/[locale]/architecture/ArchitectureTopologyView.module.css"),
	]);

	assert.match(sectionHeading, /AnchoredHeading/);
	assert.match(sectionHeadingCss, /color: var\(--ui-link\)/);
	assert.match(sectionHeadingCss, /font-size: clamp\(2\.25rem, 4\.5vw, 3\.5rem\)/);
	assert.match(hardware, /<SectionHeading id="hardware" iconClass="fa-server">/);
	assert.match(homelab, /<SectionHeading id="homelab" iconClass="fa-layer-group">/);
	assert.match(services, /<SectionHeading id=\{headingId\} iconClass="fa-server">/);
	assert.doesNotMatch(services, /fa-cubes-stacked/);
	assert.match(architecture, /id="homelab-network-ingress-paths"/);
	assert.match(architecture, /iconClass="fa-network-wired"/);
	assert.match(architecture, /id="declared-observed-health"/);
	assert.match(architecture, /iconClass="fa-heart-pulse"/);
	assert.match(architectureCss, /\.sectionHeading h2::after/);
	assert.match(architectureCss, /content: "#"/);
	assert.match(architectureCss, /color: var\(--ui-link\)/);
});

test("storage roles reuse the semantic runtime failure red", async () => {
	const fastPool = await source("app/components/truenas/FastPoolPlan.tsx");
	const uses = fastPool.match(/style=\{failureTone\}/g) ?? [];

	assert.match(fastPool, /const failureTone = \{ color: "var\(--ui-danger-text\)" \}/);
	assert.equal(uses.length, 3);
	assert.match(fastPool, />boot-pool<\/code>/);
	assert.match(fastPool, /\{t\("fastRole"\)\}<\/code>/);
	assert.match(fastPool, /\{t\("dataRole"\)\}<\/code>/);
});

test("shared homelab React Flow keeps wheel scrolling on the page and requires a modifier to zoom", async () => {
	const flow = await source("app/components/truenas/HomeLabNetworkFlow.tsx");

	assert.match(flow, /onWheelCapture=\{keepPageScrollUnlessZooming\}/);
	assert.match(flow, /!event\.ctrlKey && !event\.metaKey/);
	assert.match(flow, /event\.stopPropagation\(\)/);
	assert.match(flow, /data-react-flow-scroll-policy="modifier-to-zoom"/);
	assert.match(flow, /Ctrl\/Cmd \+ wheel/);
});
