import { expect, test } from "@playwright/test";

test.describe("AI homelab architecture", () => {
	test("renders the current Open WebUI service topology", async ({ page }) => {
		await page.goto("/en/ai");

		await expect(page.getByRole("heading", { name: "My AI homelab architecture" })).toBeVisible();
		await expect(page.getByText("Open WebUI is my central AI interface")).toBeVisible();
		await expect(page.locator(".ai-homelab-mermaid svg")).toBeVisible({ timeout: 15_000 });
		await expect(page.locator(".ai-homelab-mermaid")).toContainText(/Open WebUI|SearXNG|FastAPI MCP/);
	});

	test("provides the architecture description in French", async ({ page }) => {
		await page.goto("/fr/ai");

		await expect(page.getByRole("heading", { name: "Architecture de mon homelab IA" })).toBeVisible();
		await expect(page.getByText("Open WebUI est mon interface IA centrale")).toBeVisible();
	});
});
