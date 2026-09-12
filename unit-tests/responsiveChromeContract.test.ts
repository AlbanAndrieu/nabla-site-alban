import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
	container: new URL("../components/ui/Container.module.css", import.meta.url),
	routeHeader: new URL("../components/RouteHeader.module.css", import.meta.url),
	footer: new URL("../app/components/Footer.module.css", import.meta.url),
	contactHero: new URL("../components/ContactHero.module.css", import.meta.url),
	globals: new URL("../app/globals.css", import.meta.url),
};

test("shared responsive chrome keeps the Bababou-safe layout contracts", async () => {
	const [container, routeHeader, footer, contactHero, globals] =
		await Promise.all([
			readFile(paths.container, "utf8"),
			readFile(paths.routeHeader, "utf8"),
			readFile(paths.footer, "utf8"),
			readFile(paths.contactHero, "utf8"),
			readFile(paths.globals, "utf8"),
		]);

	assert.match(container, /padding-left:\s*max\(/);
	assert.match(container, /padding-right:\s*max\(/);
	assert.match(container, /env\(safe-area-inset-left\)/);
	assert.match(container, /env\(safe-area-inset-right\)/);

	assert.match(routeHeader, /@media \(max-width:\s*900px\)/);
	assert.match(routeHeader, /@media \(max-width:\s*575\.98px\)/);
	assert.match(routeHeader, /flex-basis:\s*100%/);
	assert.match(routeHeader, /overflow-wrap:\s*anywhere/);
	assert.match(routeHeader, /min-height:\s*var\(--ui-control-min-height\)/);

	assert.match(footer, /padding:\s*clamp\(/);
	assert.match(footer, /min-height:\s*var\(--ui-control-min-height\)/);
	assert.match(footer, /overflow-wrap:\s*anywhere/);

	assert.match(contactHero, /padding:\s*clamp\(/);
	assert.match(contactHero, /max-width:\s*100%/);
	assert.match(contactHero, /overflow-wrap:\s*anywhere/);
	assert.match(contactHero, /grid-template-columns:\s*1fr/);

	assert.match(
		globals,
		/grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 12rem\), 1fr\)\)/,
	);
	assert.match(globals, /height:\s*clamp\(18rem, 45vw, 28\.125rem\)/);
	assert.match(
		globals,
		/\.contact-github-badges iframe[\s\S]*max-width:\s*100%/,
	);
});
