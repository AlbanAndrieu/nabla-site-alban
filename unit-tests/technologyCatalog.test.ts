import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { TECHNOLOGY_GROUPS } from "../lib/technologyCatalog";

test("technology catalog has unique entries and local icons", async () => {
	const technologies = TECHNOLOGY_GROUPS.flatMap((group) => group.technologies);
	const names = technologies.map(({ name }) => name);

	assert.equal(new Set(names).size, names.length);
	assert.ok(technologies.length > 40);

	await Promise.all(
		technologies.flatMap(({ icon }) =>
			icon
				? [access(path.join(process.cwd(), "public", icon.replace(/^\//, "")))]
				: [],
		),
	);
});
