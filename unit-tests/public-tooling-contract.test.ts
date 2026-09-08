import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);

test("image conversion tooling is not served from public assets", async () => {
	await access(projectUrl("scripts/jpg_to_transparent_png.py"));
	await assert.rejects(
		access(projectUrl("public/assets/jpg_to_transparent_png.py")),
	);

	const publicAssets = await readdir(projectUrl("public/assets"));
	assert.equal(publicAssets.some((entry) => entry.endsWith(".py")), false);
});

test("image conversion wrapper uses the repository script and preserves public/assets default", async () => {
	const [wrapperSource, converter] = await Promise.all([
		readFile(projectUrl("scripts/convert-jpg-to-transparent-png.sh"), "utf8"),
		readFile(projectUrl("scripts/jpg_to_transparent_png.py"), "utf8"),
	]);

	assert.match(wrapperSource, /REPO_ROOT\/scripts\/jpg_to_transparent_png\.py/);
	assert.doesNotMatch(
		wrapperSource,
		/public\/assets\/jpg_to_transparent_png\.py/,
	);
	assert.match(converter, /repo_root \/ "public" \/ "assets"/);
});
