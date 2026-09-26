import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("priority keyboard surfaces expose visible focus contracts", async () => {
	const [theme, routeHeader, policy, action, e2e] = await Promise.all([
		read("public/theme.css"),
		read("components/RouteHeader.module.css"),
		read("app/[locale]/policy/page.module.css"),
		read("components/ui/Action.module.css"),
		read("tests/accessibility-keyboard.spec.ts"),
	]);

	assert.match(
		theme,
		/a:focus-visible,\s*button:focus-visible\s*{[^}]*outline:\s*2px solid/s,
	);
	assert.match(
		routeHeader,
		/\.select:focus-visible\s*{[^}]*outline:\s*3px solid var\(--ui-focus-ring\)/s,
	);
	assert.match(
		policy,
		/\.cardTitle a:focus-visible\s*{[^}]*outline:\s*3px solid var\(--ui-focus-ring\)/s,
	);
	assert.match(
		action,
		/\.action:focus-visible\s*{[^}]*outline:\s*3px solid var\(--ui-focus-ring\)/s,
	);

	for (const route of ["/", "/contact", "/fr/contact", "/policy"]) {
		assert.match(e2e, new RegExp(JSON.stringify(route).slice(1, -1)));
	}
	assert.match(e2e, /tabUntilFocused/);
	assert.match(e2e, /element\.matches\(":focus-visible"\)/);
	assert.match(e2e, /outlineWidth > 0 \|\| hasBoxShadow/);
	assert.match(e2e, /inViewport/);
	assert.match(e2e, /#route-header-locale/);
	assert.match(e2e, /main a\[href\]:visible/);
});
