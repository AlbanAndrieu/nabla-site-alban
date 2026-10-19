import { expect, test } from "@playwright/test";

// The interactive LAN graph moved behind owner authentication: never
// restore its public DOM purely to satisfy a former scrolling test.
test("public architecture never mounts a private React Flow graph", async ({
	page,
}) => {
	await page.goto("/architecture");
	await expect(page.locator("#architecture-title")).toBeVisible();
	await expect(page.locator(".react-flow")).toHaveCount(0);
	await expect(
		page.locator('a[href="https://ops.albandrieu.com/"]'),
	).toBeVisible();
});

test("public TrueNAS keeps its service heading without network flow", async ({
	page,
}) => {
	await page.goto("/truenas");
	const heading = page.locator("#truenas-services");
	await expect(heading).toBeVisible();
	await expect(heading).not.toContainText("E4E6");
	await expect(page.locator(".react-flow")).toHaveCount(0);
	await expect(
		page.locator('a[href="https://ops.albandrieu.com/"]'),
	).toBeVisible();
});
