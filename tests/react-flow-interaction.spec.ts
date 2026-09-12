import { expect, test, type Page } from "@playwright/test";

async function expectModifierToZoomPolicy(page: Page, path: string) {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(path, { waitUntil: "domcontentloaded" });

	const guard = page.locator(
		'[data-react-flow-scroll-policy="modifier-to-zoom"]',
	);
	await guard.scrollIntoViewIfNeeded();
	await expect(guard).toBeVisible();

	const flow = guard.locator(".react-flow");
	const viewport = flow.locator(".react-flow__viewport");
	await expect(flow).toBeVisible();
	await expect(viewport).toBeVisible();

	await guard.hover();
	const pageScrollBefore = await page.evaluate(() => window.scrollY);
	const transformBeforePlainWheel = await viewport.getAttribute("style");
	await page.mouse.wheel(0, 480);
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThan(pageScrollBefore);
	await expect(viewport).toHaveAttribute(
		"style",
		transformBeforePlainWheel ?? "",
	);

	await guard.scrollIntoViewIfNeeded();
	await guard.hover();
	const transformBeforeZoom = await viewport.getAttribute("style");
	await page.keyboard.down("Control");
	await page.mouse.wheel(0, -320);
	await page.keyboard.up("Control");
	await expect
		.poll(() => viewport.getAttribute("style"))
		.not.toBe(transformBeforeZoom);
}

test("TrueNAS services heading has no private-use glyph leakage", async ({
	page,
}) => {
	await page.goto("/truenas", { waitUntil: "domcontentloaded" });

	const heading = page.locator("#truenas-services");
	await expect(heading).toBeVisible();
	await expect(heading).toContainText("TrueNAS services");
	await expect(heading).not.toContainText("E4E6");
	await expect(heading.locator(".fa-server")).toBeVisible();
	await expect(heading.locator('a[href="#truenas-services"]')).toBeVisible();
});

test("architecture network flow reserves wheel zoom for Ctrl/Cmd", async ({
	page,
}) => {
	await expectModifierToZoomPolicy(page, "/architecture");
});

test("TrueNAS homelab flow reserves wheel zoom for Ctrl/Cmd", async ({
	page,
}) => {
	await expectModifierToZoomPolicy(page, "/truenas#homelab");
});
