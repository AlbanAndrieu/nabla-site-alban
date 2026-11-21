import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);
const SOURCE = /\.(?:ts|tsx|mjs|js|json)$/;
// H17: nabla-compose may delete its legacy exports only once no site code reads them.
const LEGACY_READERS =
	/\/api\/homelab-(?:services|topology)\b|catalog\/generated\/|operator-inventory|service-topology\.json|homelab-services\.json/;

async function* sources(dir) {
	for (const entry of await readdir(new URL(dir, ROOT), {
		withFileTypes: true,
	})) {
		const path = `${dir}/${entry.name}`;
		if (entry.isDirectory()) yield* sources(path);
		else if (SOURCE.test(entry.name)) yield path;
	}
}

test("no runtime code reads V1 routes or nabla-compose legacy catalog exports", async () => {
	const offenders = [];
	for (const dir of ["app", "lib", "components", "scripts"]) {
		for await (const path of sources(dir)) {
			if (LEGACY_READERS.test(await readFile(new URL(path, ROOT), "utf8")))
				offenders.push(path);
		}
	}
	assert.deepEqual(offenders, []);
});
