import { expect, test, type Page } from "@playwright/test";

const catalog = {
	version: 1,
	services: [
		{
			id: "langflow",
			name: "Langflow",
			description: "E2E deep-link fixture",
			endpointUrl: "https://langflow.albandrieu.com/",
			external: true,
			endpointEnabled: true,
		},
	],
};

const health = {
	schema_version: 5,
	checked_at: "2026-09-04T10:00:00Z",
	services: [
		{
			id: "langflow",
			name: "Langflow",
			url: "https://langflow.albandrieu.com/",
			reachable: true,
			http_status: 200,
			state: "ok",
			local_state: "ok",
			dependency_state: null,
			effective_state: "ok",
			required_dependencies: [],
			blocked_by: [],
			dependency_evidence: [],
			observation_stale: false,
			tls_trusted: true,
			latency_ms: 12,
			direct_state: "ok",
			runtime_state: "RUNNING",
			runtime_app: "langflow",
		},
	],
	truenas_runtime_reachable: true,
	truenas_runtime_stale: false,
};

const topology = {
	version: 1,
	name: "deep-link-e2e",
	nodes: [
		{
			id: "langflow",
			name: "Langflow",
			kind: "service",
			category: "application",
		},
	],
	relations: [],
};

const observability = {
	board: {
		state: "fresh",
		refreshing: false,
		generatedAt: "2026-09-04T10:00:00Z",
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
	controlPlaneDiagnostics: {},
	sources: {
		board: "health-board",
		runtime: "unavailable",
		diagnostics: "unavailable",
	},
};

async function mockHomelabApis(page: Page) {
	await page.route("**/api/homelab-services", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(catalog),
		});
	});
	await page.route("**/api/homelab-health", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(health),
		});
	});
	await page.route("**/api/homelab-topology", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(topology),
		});
	});
	await page.route("**/api/homelab-observability", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(observability),
		});
	});
	for (const path of ["homelab-diagnostics", "runtime-topology"]) {
		await page.route("**/api/" + path, async (route) => {
			await route.fulfill({
				status: 503,
				contentType: "application/json",
				body: "{}",
			});
		});
	}
}

test.describe("homelab delayed deep links", () => {
	test.beforeEach(async ({ page }) => {
		await mockHomelabApis(page);
	});

	test("opens a service troubleshooting panel that mounts after navigation", async ({
		page,
	}) => {
		await page.goto("/en/truenas#service-langflow");

		const details = page.locator("#service-langflow");
		await expect(details).toHaveAttribute("open", "");
		await expect(details).toBeInViewport();
		await expect(details.getByText("Why this status?")).toBeVisible();
		await expect(page).toHaveURL(/#service-langflow$/);
	});

	test("opens pfSense operational evidence after observability data arrives", async ({
		page,
	}) => {
		await page.goto("/en/truenas#pfsense-operational-evidence");

		const details = page.locator("#pfsense-operational-evidence");
		await expect(details).toHaveAttribute("open", "");
		await expect(details).toBeInViewport();
		await expect(page).toHaveURL(/#pfsense-operational-evidence$/);
	});
});
