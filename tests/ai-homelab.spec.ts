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

		const flow = page.getByRole("list", { name: "Layered AI platform flow" });
		await expect(flow).toBeVisible();
		await expect(flow).toContainText("Open WebUI");
		await expect(flow).toContainText("LiteLLM");
		await expect(flow).toContainText("FastAPI MCP");
		await expect(flow).toContainText("SearXNG");
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
		await expect(
			page.getByRole("list", { name: "Flux en couches de la plateforme IA" }),
		).toBeVisible();
	});
});
