import { expect, test } from "@playwright/test";

const budgets = {
	ttfbMs: 3000,
	domContentLoadedMs: 5000,
	loadMs: 8000,
	requestCount: 120,
	totalTransferBytes: 4_000_000,
	jsTransferBytes: 2_000_000,
	cssTransferBytes: 1_000_000,
} as const;

test.describe("Performance baseline", () => {
	test("homepage stays within basic navigation and transfer budgets", async ({
		page,
	}) => {
		await page.goto("/en", { waitUntil: "load" });

		const metrics = await page.evaluate(() => {
			const navigation = performance.getEntriesByType(
				"navigation",
			)[0] as PerformanceNavigationTiming;
			const resources = performance.getEntriesByType(
				"resource",
			) as PerformanceResourceTiming[];

			const transferFor = (type: "script" | "link") =>
				resources
					.filter((resource) => resource.initiatorType === type)
					.reduce((sum, resource) => sum + resource.transferSize, 0);

			return {
				ttfbMs: navigation.responseStart,
				domContentLoadedMs: navigation.domContentLoadedEventEnd,
				loadMs: navigation.loadEventEnd,
				requestCount: resources.length,
				totalTransferBytes:
					navigation.transferSize +
					resources.reduce((sum, resource) => sum + resource.transferSize, 0),
				jsTransferBytes: transferFor("script"),
				cssTransferBytes: transferFor("link"),
			};
		});

		test.info().annotations.push({
			type: "performance",
			description: JSON.stringify(metrics),
		});

		expect(metrics.ttfbMs).toBeLessThanOrEqual(budgets.ttfbMs);
		expect(metrics.domContentLoadedMs).toBeLessThanOrEqual(
			budgets.domContentLoadedMs,
		);
		expect(metrics.loadMs).toBeLessThanOrEqual(budgets.loadMs);
		expect(metrics.requestCount).toBeLessThanOrEqual(budgets.requestCount);
		expect(metrics.totalTransferBytes).toBeLessThanOrEqual(
			budgets.totalTransferBytes,
		);
		expect(metrics.jsTransferBytes).toBeLessThanOrEqual(
			budgets.jsTransferBytes,
		);
		expect(metrics.cssTransferBytes).toBeLessThanOrEqual(
			budgets.cssTransferBytes,
		);
	});
});
