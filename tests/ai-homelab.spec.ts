import { expect, test } from "@playwright/test";

test.describe("AI homelab architecture", () => {
	test("renders the current Open WebUI service topology", async ({ page }) => {
		await page.goto("/ai");

		await expect(
			page.getByRole("heading", { name: "My AI platform architecture" }),
		).toBeVisible();
		await expect(
			page.getByText("LiteLLM is the central control plane", { exact: false }),
		).toBeVisible();
		await expect(page.locator(".ai-homelab-mermaid svg")).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator(".ai-homelab-mermaid")).toContainText(
			/Open WebUI|SearXNG|FastAPI MCP/,
		);
	});

	test("provides the architecture description in French", async ({ page }) => {
		await page.goto("/fr/ai");

		await expect(
			page.getByRole("heading", { name: "Architecture de ma plateforme IA" }),
		).toBeVisible();
		await expect(
			page.getByText("LiteLLM constitue le plan de contrôle central", {
				exact: false,
			}),
		).toBeVisible();
	});
});
