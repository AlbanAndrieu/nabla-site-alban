import { expect, test } from "@playwright/test";

test.describe("Public homelab integration boundary", () => {
	test("catalog, topology and diagnostics fail closed without credentials", async ({
		request,
	}) => {
		for (const endpoint of [
			"homelab-services",
			"homelab-topology",
			"homelab-health",
			"homelab-observability",
			"runtime-topology",
		]) {
			const response = await request.get(`/api/${endpoint}`);
			expect(response.status(), `private endpoint ${endpoint}`).toBe(404);
			expect(response.headers()["cache-control"]).toContain("no-store");
			expect(response.headers()["x-homelab-services-primary"]).toBeUndefined();
			expect(response.headers()["x-homelab-topology-primary"]).toBeUndefined();
			expect(await response.json()).toEqual({ error: "Not found" });
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
