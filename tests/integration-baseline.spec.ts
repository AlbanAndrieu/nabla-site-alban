import { expect, test } from "@playwright/test";

test.describe("Public homelab integration boundary", () => {
	test("public SERVICE projection never authorizes raw OWNER APIs", async ({
		request,
	}) => {
		const access = await request.get("/api/homelab-access");
		expect(access.status()).toBe(200);
		const identity = (await access.json()) as { trusted?: boolean; mode?: string };
		const publicReadOnly = identity.mode === "public-readonly";
		if (publicReadOnly) expect(identity.trusted).toBe(true);
		else expect(identity.trusted).toBe(false);
		for (const endpoint of [
			"homelab-services",
			"homelab-topology",
			"homelab-health",
			"homelab-observability",
			"runtime-topology",
		]) {
			const response = await request.get(`/api/${endpoint}`);
			expect(response.headers()["cache-control"]).toContain("no-store");
			expect(response.headers()["x-homelab-services-primary"]).toBeUndefined();
			expect(response.headers()["x-homelab-topology-primary"]).toBeUndefined();
			if (publicReadOnly && endpoint === "homelab-services") {
				// Only the allowlisted public SERVICE catalog may be served.
				expect([200, 503]).toContain(response.status());
				if (response.status() === 200) {
					const catalog = await response.json();
					expect(catalog).not.toHaveProperty("diagnostics");
					expect(catalog).not.toHaveProperty("health_board");
				}
				continue;
			}
			expect(response.status(), `private endpoint ${endpoint}`).toBe(404);
			expect(await response.json()).toEqual({
				error: "Operational homelab data is private",
			});
		}
	});

	test("public architecture remains readable without operational graph", async ({
		page,
	}) => {
		await page.goto("/en/architecture");
		await expect(page.locator("#architecture-title")).toBeVisible();
		await expect(page.locator("#service-architecture-explorer")).toHaveCount(0);
		await expect(
			page.locator('a[href="https://ops.albandrieu.com/"]'),
		).toBeVisible();
	});
});
