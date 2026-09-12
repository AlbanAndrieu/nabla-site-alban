import { expect, test } from "@playwright/test";

test("Nabla hero cards stay contained on mobile without Bootstrap primitives", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/en/nabla", { waitUntil: "domcontentloaded" });

	const cards = page.locator("[data-nabla-hero-card]");
	await expect(cards).toHaveCount(3);

	for (let index = 0; index < 3; index += 1) {
		const card = cards.nth(index);
		await card.scrollIntoViewIfNeeded();
		await expect(card).toBeVisible();
		await expect(card.locator(".btn, .badge")).toHaveCount(0);

		const box = await card.boundingBox();
		expect(box).not.toBeNull();
		if (!box) continue;

		expect(box.x).toBeGreaterThanOrEqual(-1);
		expect(box.width).toBeLessThanOrEqual(390);
		expect(box.x + box.width).toBeLessThanOrEqual(391);
	}
});
