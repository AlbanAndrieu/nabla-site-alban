import { expect, test } from "@playwright/test";

test.describe("Integration baseline", () => {
	test("homelab catalog and topology APIs stay coherent with architecture", async ({
		page,
		request,
	}) => {
		const [servicesResponse, topologyResponse] = await Promise.all([
			request.get("/api/homelab-services"),
			request.get("/api/homelab-topology"),
		]);

		expect(servicesResponse.ok()).toBe(true);
		expect(topologyResponse.ok()).toBe(true);
		expect(servicesResponse.headers()["cache-control"]).toContain("no-store");
		expect(topologyResponse.headers()["cache-control"]).toContain("no-store");
		expect(servicesResponse.headers()["x-homelab-services-source"]).toBeTruthy();
		expect(topologyResponse.headers()["x-homelab-topology-source"]).toBeTruthy();

		const services = (await servicesResponse.json()) as {
			version?: number;
			services?: Array<{ name?: string }>;
		};
		const topology = (await topologyResponse.json()) as {
			version?: number;
			nodes?: Array<{ id?: string }>;
			relations?: Array<{ source?: string; target?: string; type?: string }>;
		};

		expect(services.version).toBe(1);
		expect(Array.isArray(services.services)).toBe(true);
		const serviceNames = new Set((services.services ?? []).map((service) => service.name));
		expect(serviceNames.has("TrueNAS")).toBe(true);
		expect(serviceNames.has("Open WebUI")).toBe(true);

		expect(topology.version).toBe(1);
		expect(Array.isArray(topology.nodes)).toBe(true);
		expect(Array.isArray(topology.relations)).toBe(true);
		const nodeIds = new Set((topology.nodes ?? []).map((node) => node.id));
		for (const id of ["truenas", "traefik", "cloudflared", "openwebui", "garage"]) {
			expect(nodeIds.has(id), `missing topology node ${id}`).toBe(true);
		}
		const hasRelation = (source: string, target: string, type: string) =>
			(topology.relations ?? []).some(
				(relation) =>
					relation.source === source &&
					relation.target === target &&
					relation.type === type,
			);
		expect(hasRelation("openwebui", "cloudflared", "exposedBy")).toBe(true);
		expect(hasRelation("garage", "traefik", "exposedBy")).toBe(true);

		await page.goto("/en/architecture");
		await expect(
			page.getByRole("heading", { level: 1, name: /Interactive Nabla architecture/i }),
		).toBeVisible();
		await expect(page.locator("#homelab-network-ingress-paths")).toBeVisible();
	});
});
