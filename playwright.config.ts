import { defineConfig, devices } from "@playwright/test";

const requestedPort = Number(process.env.PLAYWRIGHT_PORT || 3000);
const testPort =
	Number.isInteger(requestedPort) &&
	requestedPort >= 1 &&
	requestedPort <= 65535
		? requestedPort
		: 3000;
const localTestUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	/* One CI retry is enough to identify flakes while avoiding duplicate deterministic failures. */
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		["html", { outputFolder: "playwright-report" }],
		["list"],
		...(process.env.CI
			? [
					["github"] as const,
					["junit", { outputFile: "test-results/junit.xml" }] as const,
				]
			: []),
	],
	use: {
		baseURL: process.env.BASE_URL || localTestUrl,
		navigationTimeout: 30_000,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		actionTimeout: 10000,
	},
	expect: { timeout: 5000 },
	timeout: process.env.CI ? 60_000 : 30_000,
	globalTimeout: 3_600_000,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},
	],
	webServer: {
		command: `${process.env.CI ? "npm run start:test" : "npm run dev:test"} -- --port ${testPort}`,
		url: `${localTestUrl}/fr`,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
});
