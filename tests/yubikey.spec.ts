import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Public, read-only UI checks. Run locally against a matching exact-SHA Preview:
// BASE_URL=https://<preview-host> npx playwright test tests/yubikey.spec.ts --project=chromium
// For protected previews, use the existing Playwright config's bypass settings.

// Detect edge protection separately from an application failure.
async function openGuide(page: Page, path: string) {
	const response = await page.goto(path, { waitUntil: "domcontentloaded" });
	if (!response) {
		throw new Error(`YubiKey route ${path}: no navigation response`);
	}
	const status = response.status();
	const mitigation = response.headers()["x-vercel-mitigated"];
	if (
		mitigation === "challenge" ||
		(status === 429 &&
			(await page.title()).includes("Vercel Security Checkpoint"))
	) {
		throw new Error(
			`YubiKey route ${path}: Vercel security checkpoint (HTTP ${status}); the app was not reached. Run with an authorized automation bypass or a permitted browser session, without disabling site protection.`
		);
	}
	expect(response.ok(), `YubiKey route ${path}: HTTP ${status}`).toBeTruthy();
	// The client-only canvas renders after hydration; interact only once it exists.
	await expect(page.locator(".react-flow")).toBeVisible();
	return response;
}

for (const locale of ["fr", "en"] as const) {
	const path = `${locale === "fr" ? "/fr" : ""}/security/yubikey`;
	const homePath = locale === "fr" ? "/fr" : "/";
	const graphSelectorLabel = locale === "fr"
		? "Sélectionner un composant du graphe"
		: "Select a graph component";
	const backupLabel = locale === "fr" ? "YubiKey secondaire" : "Backup YubiKey";

	test.describe(`YubiKey Security (${locale})`, () => {
		test("renders localized content, metadata and 14 sourced examples", async ({ page }) => {
			await openGuide(page, path);
			await expect(page.locator("html")).toHaveAttribute("lang", locale);
			await expect(page.locator(".page-security header h1")).toBeVisible();
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				"href",
				new RegExp(path + "$"),
			);
			const cases = page.locator('#yubikey-use-cases article[id^="yubikey-use-"]');
			await expect(cases).toHaveCount(14);
			await expect(cases.locator('a[href^="https://"]')).toHaveCount(14);
			await expect(page.locator("#yubikey-glossary article")).toHaveCount(25);
			await expect(page.locator("#yubikey-graph-title")).toBeVisible();
			await expect(page.getByText(locale === "fr" ? "Liste accessible des relations du diagramme" : "Accessible list of diagram relationships")).toBeVisible();
			await expect(page.locator("#yubikey-use-cases")).toBeVisible();
		});

		test("supports keyboard graph selection and shared footer controls", async ({ page }) => {
			await openGuide(page, path);
			const selector = page.getByRole("group", { name: graphSelectorLabel });
			const backup = selector.getByRole("button", { name: backupLabel });
			await expect(backup).toBeVisible();
			await backup.focus();
			await expect(backup).toBeFocused();
			await page.keyboard.press("Enter");
			await expect(backup).toHaveAttribute("aria-pressed", "true");
			// ReactFlow nodes and edges are not duplicate keyboard targets:
			// the labeled buttons provide the complete selection workflow.
			await expect(page.locator(".react-flow__node[tabindex='0']")).toHaveCount(0);
			await expect(page.locator(".react-flow__edge[tabindex='0']")).toHaveCount(0);
			await expect(page.locator('section[aria-labelledby="yubikey-graph-title"] [aria-live="polite"]')).toContainText(backupLabel);

			const headerHome = page.locator('header nav a:has(i.fa-home)').first();
			await expect(headerHome).toHaveAttribute("href", homePath);
			await expect(headerHome).toBeVisible();
			const footer = page.locator('footer[role="contentinfo"]');
			const home = footer.locator(`a[href="${homePath}"]:has(i.fa-home)`);
			const top = footer.locator("button:has(i.fa-arrow-up)");
			await expect(home).toBeVisible();
			await expect(top).toBeVisible();
			// Check the rendered Font Awesome glyph, not only its CSS class.
			for (const icon of [headerHome.locator("i.fa-home"), home.locator("i.fa-home"), top.locator("i.fa-arrow-up")]) {
				const content = await icon.evaluate((element) =>
					window.getComputedStyle(element, "::before").content
				);
				expect(["none", "normal", '""', "''"]).not.toContain(content);
			}
			await page.locator("#yubikey-next").scrollIntoViewIfNeeded();
			await top.click();
			await expect(page).toHaveURL(/#top$/);
			await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
			await home.click();
			await expect.poll(() => page.evaluate(() => window.location.pathname)).toBe(homePath);
		});

		test("respects reduced motion when returning to the top", async ({ page }) => {
			await page.emulateMedia({ reducedMotion: "reduce" });
			await openGuide(page, path);
			const top = page.locator('footer[role="contentinfo"] button:has(i.fa-arrow-up)');
			await page.locator("#yubikey-next").scrollIntoViewIfNeeded();
			await top.scrollIntoViewIfNeeded();
			await page.evaluate(() => {
				const nativeScrollTo = window.scrollTo.bind(window);
				window.scrollTo = ((options: ScrollToOptions) => {
					document.documentElement.dataset.backToTopBehavior = String(options.behavior);
					nativeScrollTo(options);
				}) as typeof window.scrollTo;
			});
			await top.click();
			await expect(page.locator("html")).toHaveAttribute("data-back-to-top-behavior", "auto");
		});

		test("scans the YubiKey controls and examples for automated WCAG A/AA issues", async ({ page }) => {
			await openGuide(page, path);
			const selector = page.getByRole("group", { name: graphSelectorLabel });
			await selector.getByRole("button", { name: backupLabel }).click();
			const audit = await new AxeBuilder({ page })
				.include("footer[role='contentinfo']")
				.include("#yubikey-use-cases")
				.include("section[aria-labelledby='yubikey-graph-title']")
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
				.analyze();
			const findings = audit.violations.map(({ id, impact, nodes }) => ({
				id,
				impact,
				targets: nodes.flatMap((node) => node.target),
			}));
			expect(findings).toEqual([]);
		});

		test("keeps graph, footer and cards within narrow mobile viewports", async ({ page }) => {
			for (const width of [320, 390]) {
				await page.setViewportSize({ width, height: 700 });
				await openGuide(page, path);
				await expect(page.locator("#yubikey-use-cases")).toBeVisible();
				const dimensions = await page.evaluate(() => ({
					client: document.documentElement.clientWidth,
					scroll: document.documentElement.scrollWidth,
				}));
				expect(dimensions.scroll, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.client + 1);
				const selectors = page.getByRole("group", { name: graphSelectorLabel }).getByRole("button");
				await expect(selectors).toHaveCount(11);
				const first = await selectors.first().boundingBox();
				expect(first?.height ?? 0).toBeGreaterThanOrEqual(44);
			}
		});
	});
}
