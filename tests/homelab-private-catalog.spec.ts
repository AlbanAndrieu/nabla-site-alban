import { expect, test, type Page } from "@playwright/test";

// Browser routing exercises the client state machine. The real API remains
// owner-gated on the server; no test key or private inventory is checked in.
async function mockOwner(page: Page) {
	await page.route("**/api/homelab-access", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ trusted: true }),
		}),
	);
	await page.route("**/api/homelab-health", (route) =>
		route.fulfill({ status: 503, body: "unavailable" }),
	);
	await page.route("**/api/homelab-probes", (route) =>
		route.fulfill({ status: 503, body: "unavailable" }),
	);
}

test("owner cards render when private catalog succeeds and topology fails", async ({
	page,
}) => {
	await mockOwner(page);
	await page.route("**/api/homelab-topology", (route) =>
		route.abort("failed"),
	);
	await page.route("**/api/homelab-services", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				version: 2,
				catalogRevision: `sha256:${"a".repeat(64)}`,
				services: [
					{ id: "postgresql", name: "PostgreSQL", endpointEnabled: false },
					{ id: "prometheus", name: "Prometheus", endpointEnabled: false },
				],
			}),
		}),
	);
	await page.goto("/fr/truenas");
	await expect(page.locator("[data-homelab-private-view]")).toBeVisible();
	await expect(page.locator("#homelab-service-postgresql")).toBeVisible();
	await expect(page.locator("#service-postgresql")).toHaveCount(1);
	await expect(page.locator("#homelab-service-prometheus")).toBeVisible();
	await expect(page.locator("[data-homelab-inventory-unavailable]")).toHaveCount(0);
});

test("owner gets an explicit unavailable state, not an invented card", async ({
	page,
}) => {
	await mockOwner(page);
	await page.route("**/api/homelab-topology", (route) =>
		route.fulfill({ status: 503, body: "unavailable" }),
	);
	await page.route("**/api/homelab-services", (route) =>
		route.fulfill({
			status: 503,
			contentType: "application/json",
			body: JSON.stringify({
				error: "Backstage v2 inventory unavailable",
				reason: "access-denied",
			}),
		}),
	);
	await page.goto("/fr/truenas");
	await expect(page.locator("[data-homelab-inventory-unavailable]")).toBeVisible();
	await expect(page.locator("#homelab-service-homelab")).toHaveCount(0);
});

test("anonymous browsers do not request or render a private catalog", async ({
	page,
}) => {
	let privateCatalogRequests = 0;
	await page.route("**/api/homelab-access", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ trusted: false }),
		}),
	);
	await page.route("**/api/homelab-services", (route) => {
		privateCatalogRequests += 1;
		return route.fulfill({ status: 404 });
	});
	await page.goto("/fr/truenas");
	await expect(page.locator("[data-homelab-private-denied]")).toBeVisible();
	await expect(page.locator("[data-homelab-private-view]")).toHaveCount(0);
	expect(privateCatalogRequests).toBe(0);
});
