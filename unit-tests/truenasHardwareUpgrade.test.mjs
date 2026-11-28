import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("memory and mirrored SSD upgrades precede GPU upgrades", async () => {
	const bom = await source("app/components/truenas/BillOfMaterialsSection.tsx");
	assert.ok(
		bom.indexOf("<MemoryUpgradePlan />") < bom.indexOf("<FastPoolPlan />"),
	);
	assert.ok(
		bom.indexOf("<FastPoolPlan />") < bom.indexOf("<GpuUpgradePlan />"),
	);
	assert.match(bom, /<MemoryUpgradePlan \/>/);
	assert.match(bom, /<FastPoolPlan \/>/);
});

test("hardware upgrade copy is bilingual, grounded and explicitly planned", async () => {
	for (const locale of ["fr", "en"]) {
		const { truenas } = JSON.parse(
			await source(`messages/truenas/${locale}.json`),
		);
		const { memory, fastPool } = truenas.upgrades;
		assert.match(memory.title, /128/);
		assert.match(memory.current, /CT64G56C46U5/);
		assert.match(memory.validation, /5200 MT\/s/);
		assert.match(fastPool.fastDevice, /2 ×.*2/);
		assert.match(fastPool.dataRole, /RAIDZ2/);
		assert.match(fastPool.capacity, /1[,.]45/);
		assert.match(fastPool.kioxia, /Kioxia/);
		assert.match(fastPool.lexar, /Lexar/);
		assert.match(fastPool.caution, /PLP/);
		assert.match(fastPool.caution, /L2ARC/);
		assert.equal(memory.badge, fastPool.badge);
	}
	const fastPool = await source("app/components/truenas/FastPoolPlan.tsx");
	assert.doesNotMatch(fastPool, /unitPrice|formatEuro/);
	assert.match(fastPool, /HARDWARE_UPGRADE_SOURCES\.kioxia/);
	assert.match(fastPool, /HARDWARE_UPGRADE_SOURCES\.lexar/);
});
