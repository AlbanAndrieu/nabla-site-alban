import { expect, test, type Locator, type Page } from "@playwright/test";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";

const serviceFixtures = [
	{ id: "fixture-ok", name: "Healthy fixture", state: "ok", stale: false },
	{ id: "fixture-warn", name: "Degraded fixture", state: "warn", stale: false },
	{ id: "fixture-fail", name: "Failed fixture", state: "fail", stale: false },
	{ id: "fixture-unknown", name: "Unknown fixture", state: "unknown", stale: false },
	{ id: "fixture-stale", name: "Stale fixture", state: "ok", stale: true },
] as const;

const catalog = {
	version: 1,
	services: serviceFixtures.map((fixture) => ({
		id: fixture.id,
		name: fixture.name,
		description: `E2E health/theme fixture for ${fixture.state}`,
		endpointUrl: `https://${fixture.id}.example.test/`,
		external: true,
		endpointEnabled: true,
		presentationRole: "service",
		criticality: "medium",
	})),
};

const health = {
	schema_version: 5,
	checked_at: "2026-09-06T09:00:00Z",
	services: serviceFixtures.map((fixture) => ({
		id: fixture.id,
		name: fixture.name,
		url: `https://${fixture.id}.example.test/`,
		reachable: fixture.state !== "fail",
		http_status:
			fixture.state === "ok" || fixture.state === "warn" ? 200 : fixture.state === "fail" ? 503 : 0,
		state: fixture.state,
		local_state: fixture.state,
		dependency_state: null,
		effective_state: fixture.state,
		required_dependencies: [],
		blocked_by: [],
		dependency_evidence: [],
		observation_stale: fixture.stale,
		observation_age_seconds: fixture.stale ? 240 : 5,
		tls_trusted: fixture.state === "fail" ? false : true,
		latency_ms: fixture.state === "warn" ? 900 : 20,
		direct_state: fixture.state,
		runtime_state: fixture.state === "fail" ? "FAILED" : "RUNNING",
		runtime_app: fixture.id,
	})),
	truenas_runtime_reachable: true,
	truenas_runtime_stale: false,
};

const topology = {
	version: 1,
	name: "health-theme-e2e",
	nodes: serviceFixtures.map((fixture) => ({
		id: fixture.id,
		name: fixture.name,
		kind: "service",
		category: "application",
	})),
	relations: [],
};

const observability = {
	board: {
		state: "fresh",
		refreshing: false,
		generatedAt: "2026-09-06T09:00:00Z",
	},
	components: [
		{ id: "truenas", state: "ok", reachable: true, stale: false },
		{ id: "pfsense", state: "ok", reachable: true, stale: false },
		{ id: "cloudflare", state: "ok", reachable: true, stale: false },
	],
	pfsense: {
		configured: true,
		reachable: true,
		policyState: "ok",
		reason: "E2E fixture",
		securityFilters: [],
		ingressBlock: null,
	},
	exposurePorts: [],
	providerCredentials: [],
	staleServices: [],
	dependencyCycles: [],
	troubleshootingFocus: "dependencies",
	healthSnapshot: null,
	runtimeTopology: null,
	deepDiagnostics: { checks: [] },
	diagnostics: null,
	cloudflareCache: null,
	pfsenseIngressPolicy: null,
	edgeEvidenceSkips: [],
	controlPlaneDiagnostics: {},
	sources: {
		board: "health-board",
		runtime: "unavailable",
		diagnostics: "unavailable",
	},
} satisfies HomelabObservabilitySnapshot;

async function mockHomelabApis(page: Page) {
	const payloads: Record<string, unknown> = {
		"homelab-services": catalog,
		"homelab-health": health,
		"homelab-topology": topology,
		"homelab-observability": observability,
	};
	for (const [path, payload] of Object.entries(payloads)) {
		await page.route(`**/api/${path}`, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(payload),
			});
		});
	}
	for (const path of ["homelab-diagnostics", "runtime-topology"]) {
		await page.route(`**/api/${path}`, async (route) => {
			await route.fulfill({
				status: 503,
				contentType: "application/json",
				body: "{}",
			});
		});
	}
}

async function forceTheme(page: Page, theme: "light" | "dark") {
	await page.addInitScript((selectedTheme) => {
		localStorage.setItem("site-theme-preference", selectedTheme);
	}, theme);
}

function healthCard(page: Page, name: string): Locator {
	return page.locator(".service-card-ux").filter({ hasText: name }).first();
}

function parseRgb(value: string): [number, number, number] {
	const match = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
	if (!match) throw new Error(`Expected rgb/rgba color, received: ${value}`);
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
	const linear = [red, green, blue].map((channel) => {
		const value = channel / 255;
		return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
	const foregroundLuminance = relativeLuminance(parseRgb(foreground));
	const backgroundLuminance = relativeLuminance(parseRgb(background));
	const lightest = Math.max(foregroundLuminance, backgroundLuminance);
	const darkest = Math.min(foregroundLuminance, backgroundLuminance);
	return (lightest + 0.05) / (darkest + 0.05);
}

async function expectHealthStates(page: Page) {
	for (const fixture of serviceFixtures) {
		const card = healthCard(page, fixture.name);
		await expect(card).toBeVisible();
		await expect(card).toHaveAttribute("data-effective-health", fixture.state);

		const badge = card.locator("span[data-health-state]").first();
		await expect(badge).toHaveAttribute("data-health-state", fixture.state);

		const colors = await badge.evaluate((element) => {
			const style = getComputedStyle(element);
			return { color: style.color, backgroundColor: style.backgroundColor };
		});
		expect(
			contrastRatio(colors.color, colors.backgroundColor),
			`${fixture.name} badge should retain WCAG AA text contrast`,
		).toBeGreaterThanOrEqual(4.5);

		if (fixture.stale) {
			await expect(card.locator("[data-health-stale]")).toBeVisible();
		} else {
			await expect(card.locator("[data-health-stale]")).toHaveCount(0);
		}
	}
}

async function expectNoHorizontalOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
	}));
	expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe("homelab health state visual contracts", () => {
	test.beforeEach(async ({ page }) => {
		await mockHomelabApis(page);
	});

	for (const theme of ["light", "dark"] as const) {
		test(`TrueNAS renders all health states with AA badge contrast in ${theme} mode`, async ({
			page,
		}) => {
			await forceTheme(page, theme);
			await page.goto("/en/truenas#truenas-services");

			await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
			await expectHealthStates(page);
		});
	}

	test("Architecture keeps the same health states readable on mobile", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await forceTheme(page, "dark");
		await page.goto("/en/architecture#architecture-services");

		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expectHealthStates(page);
		await expectNoHorizontalOverflow(page);

		const healthDashboard = page.locator("#architecture-health-dashboard");
		await expect(healthDashboard).toBeVisible();
		const chips = healthDashboard.locator("[data-health-filter]");
		for (let index = 0; index < (await chips.count()); index += 1) {
			const box = await chips.nth(index).boundingBox();
			expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
		}
	});
});
