import { expect, test, type Page } from "@playwright/test";

const PRIORITY_ROUTES = [
	"/",
	"/truenas",
	"/architecture",
	"/ai",
	"/contact",
	"/cv",
] as const;

const TOKEN_PAIRS = [
	["--ui-text-primary", "--ui-surface"],
	["--ui-text-primary", "--ui-surface-card"],
	["--ui-text-secondary", "--ui-surface"],
	["--ui-chrome-text", "--ui-chrome-surface"],
	["--ui-info-text", "--ui-info-surface"],
	["--ui-success-text", "--ui-success-surface"],
	["--ui-warning-text", "--ui-warning-surface"],
	["--ui-danger-text", "--ui-danger-surface"],
] as const;

type Theme = "light" | "dark";

function parseRgb(value: string): [number, number, number] {
	const match = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
	if (!match) throw new Error(`Expected rgb/rgba color, received: ${value}`);
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
	const linear = [red, green, blue].map((channel) => {
		const value = channel / 255;
		return value <= 0.03928
			? value / 12.92
			: ((value + 0.055) / 1.055) ** 2.4;
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

async function selectThemePreference(
	page: Page,
	preference: Theme | "auto",
	colorScheme: Theme = "light",
) {
	await page.emulateMedia({ colorScheme });
	await page.addInitScript((selectedPreference) => {
		localStorage.setItem("site-theme-preference", selectedPreference);
	}, preference);
}

async function resolvedTokenPair(
	page: Page,
	foregroundToken: string,
	backgroundToken: string,
): Promise<{ foreground: string; background: string }> {
	return page.evaluate(
		({ foregroundToken: foreground, backgroundToken: background }) => {
			const probe = document.createElement("span");
			probe.style.color = `var(${foreground})`;
			probe.style.backgroundColor = `var(${background})`;
			probe.style.position = "fixed";
			probe.style.pointerEvents = "none";
			probe.style.opacity = "0";
			document.body.appendChild(probe);
			const style = getComputedStyle(probe);
			const result = {
				foreground: style.color,
				background: style.backgroundColor,
			};
			probe.remove();
			return result;
		},
		{ foregroundToken, backgroundToken },
	);
}

async function expectPriorityPageVisualContract(
	page: Page,
	route: (typeof PRIORITY_ROUTES)[number],
	expectedTheme: Theme,
) {
	await page.goto(route);
	await expect(page.locator("html")).toHaveAttribute("data-theme", expectedTheme);
	await expect(page.locator("main").first()).toBeVisible();

	const overflow = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
	}));
	expect(
		overflow.scrollWidth,
		`${route} should not overflow horizontally in ${expectedTheme} mode`,
	).toBeLessThanOrEqual(overflow.clientWidth + 1);

	for (const [foregroundToken, backgroundToken] of TOKEN_PAIRS) {
		const colors = await resolvedTokenPair(
			page,
			foregroundToken,
			backgroundToken,
		);
		expect(
			contrastRatio(colors.foreground, colors.background),
			`${route} ${expectedTheme}: ${foregroundToken} on ${backgroundToken} must retain WCAG AA contrast`,
		).toBeGreaterThanOrEqual(4.5);
	}
}

test.describe("priority page light/dark visual contracts", () => {
	test.describe.configure({ mode: "serial" });

	for (const theme of ["light", "dark"] as const) {
		test(`priority pages retain semantic contrast in explicit ${theme} mode`, async ({
			page,
		}) => {
			await selectThemePreference(page, theme, theme);
			for (const route of PRIORITY_ROUTES) {
				await expectPriorityPageVisualContract(page, route, theme);
			}
		});
	}

	for (const colorScheme of ["light", "dark"] as const) {
		test(`auto preference follows the ${colorScheme} system scheme on priority pages`, async ({
			page,
		}) => {
			await selectThemePreference(page, "auto", colorScheme);
			for (const route of PRIORITY_ROUTES) {
				await expectPriorityPageVisualContract(page, route, colorScheme);
			}
		});
	}
});
