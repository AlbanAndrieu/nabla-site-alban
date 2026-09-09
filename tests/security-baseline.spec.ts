import { expect, test } from "@playwright/test";

const sensitivePaths = [
	"/.env",
	"/.git/config",
	"/package.json",
	"/next.config.mjs",
	"/server.cjs",
];

test.describe("Pentest baseline", () => {
	test("defensive response headers are present", async ({ request }) => {
		const response = await request.get("/en");
		expect(response.ok()).toBe(true);
		const headers = response.headers();

		expect(headers["x-content-type-options"]).toBe("nosniff");
		expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
		expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
		expect(headers["permissions-policy"]).toContain("camera=()");
		expect(headers["permissions-policy"]).toContain("microphone=()");
		expect(headers["permissions-policy"]).toContain("geolocation=()");
	});

	test("repository and secret-like files are not exposed", async ({ request }) => {
		for (const path of sensitivePaths) {
			const response = await request.get(path, { failOnStatusCode: false });
			expect(
				response.status(),
				`${path} must not be publicly retrievable`,
			).toBeGreaterThanOrEqual(400);
			expect(response.status()).toBeLessThan(500);
			const body = await response.text();
			expect(body).not.toContain("STRIPE_SECRET_KEY");
			expect(body).not.toContain("VERCEL_AUTOMATION_BYPASS_SECRET");
		}
	});

	test("unexpected HTTP methods are rejected", async ({ request }) => {
		const trace = await request.fetch("/", {
			method: "TRACE",
			failOnStatusCode: false,
		});
		expect(trace.status()).toBeGreaterThanOrEqual(400);

		const apiPost = await request.post("/api/homelab-services", {
			failOnStatusCode: false,
		});
		expect(apiPost.status()).toBe(405);
	});

	test("basic reflected XSS probe does not create executable markup", async ({
		page,
	}) => {
		let dialogTriggered = false;
		page.on("dialog", async (dialog) => {
			dialogTriggered = true;
			await dialog.dismiss();
		});

		const payload =
			'<img id="pentest-xss-probe" src=x onerror="alert(1)">';
		await page.goto(`/en?q=${encodeURIComponent(payload)}`);

		await expect(page.locator("#pentest-xss-probe")).toHaveCount(0);
		expect(dialogTriggered).toBe(false);
	});
});
