import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

// An undefined custom property makes the whole declaration invalid at
// computed-value time: `outline: var(--missing) solid` silently removed the
// architecture explorer focus ring (WCAG 2.4.7) and overrode the global one.
const ROOTS = ["app", "components"];

function sources() {
	return ROOTS.flatMap((root) =>
		readdirSync(new URL(`../${root}/`, import.meta.url), { recursive: true })
			.filter((file) => /\.(css|tsx?)$/.test(file))
			.map((file) =>
				readFileSync(new URL(`../${root}/${file}`, import.meta.url), "utf8"),
			),
	);
}

test("every --ui-* token used without fallback is defined", () => {
	const all = sources().join("\n");
	const defined = new Set(
		[...all.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
	);
	const missing = [
		...new Set(
			[...all.matchAll(/var\(\s*(--ui-[a-z0-9-]+)\s*\)/g)].map(
				(match) => match[1],
			),
		),
	].filter((token) => !defined.has(token));
	assert.deepEqual(missing, []);
});

test("architecture focus rings resolve to defined tokens", () => {
	const tokens = readFileSync(
		new URL("../app/design-tokens.css", import.meta.url),
		"utf8",
	);
	assert.match(tokens, /--ui-focus-width:\s*3px;/);
	assert.match(tokens, /--ui-focus-offset:\s*3px;/);
});
