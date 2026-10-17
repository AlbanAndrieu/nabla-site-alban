import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function block(css: string, selector: string): string {
	// Top-level rules only: anchor on a line start so `a` cannot match `.data {`.
	const start = `\n${css}`.indexOf(`\n${selector} {`);
	assert.ok(start >= 0, `missing CSS block for ${selector}`);
	const open = css.indexOf("{", start);
	return css.slice(open + 1, css.indexOf("}", open));
}

function hexVar(css: string, selector: string, name: string): string {
	const match = block(css, selector).match(
		new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i"),
	);
	assert.ok(match, `missing --${name} in ${selector}`);
	return match[1].toLowerCase();
}

function luminance(hex: string): number {
	const [red, green, blue] = [1, 3, 5].map((index) => {
		const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function assertAa(foreground: string, background: string, label: string) {
	const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
		(left, right) => right - left,
	);
	const ratio = (lighter + 0.05) / (darker + 0.05);
	assert.ok(
		ratio >= 4.5,
		`${label}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1, expected >= 4.5:1`,
	);
}

test("light Bootstrap links use the themed link token instead of #0d6efd", async () => {
	const [theme, landing] = await Promise.all([
		source("public/theme.css"),
		source("public/landing-sections.css"),
	]);
	const bridge = block(theme, 'html:not([data-theme="dark"])');
	assert.match(bridge, /--bs-link-color: var\(--link-color\);/);
	assert.match(bridge, /--bs-link-hover-color: var\(--link-hover\);/);
	assert.doesNotMatch(bridge, /#0d6efd/i);
	// Same specificity as the dark bridges, which must win by source order.
	assert.ok(
		theme.indexOf('html:not([data-theme="dark"])') <
			theme.indexOf('html:not([data-theme="light"])'),
	);

	// Expertise "CV" link sits on the landing `--bg-light` section surface.
	assertAa(
		hexVar(theme, ":root", "link-color"),
		hexVar(landing, 'html[data-theme="light"]', "bg-light"),
		"light link on landing section",
	);
	assertAa(
		hexVar(theme, 'html[data-theme="dark"]', "bs-link-color"),
		hexVar(landing, 'html[data-theme="dark"]', "bg-light"),
		"dark link on landing section",
	);
});

test("outline buttons map Bootstrap button variables onto semantic tokens", async () => {
	const [globals, theme] = await Promise.all([
		source("app/globals.css"),
		source("public/theme.css"),
	]);
	const primary = block(globals, "html body .btn-outline-primary");
	const secondary = block(globals, "html body .btn-outline-secondary");
	for (const [rule, token] of [
		[primary, "--ui-link"],
		[secondary, "--ui-text-secondary"],
	] as const) {
		assert.match(rule, new RegExp(`--bs-btn-color: var\\(${token}\\);`));
		assert.match(rule, new RegExp(`--bs-btn-hover-bg: var\\(${token}\\);`));
		assert.match(rule, /--bs-btn-hover-color: var\(--ui-surface-card\);/);
		assert.doesNotMatch(rule, /#0d6efd|#6c757d|!important/i);
	}

	// --ui-link / --ui-text-secondary / --ui-surface-card resolve to these
	// theme.css (light, dark) and globals.css (.page-truenas) values.
	const surfaces = [
		["light", ":root"],
		["dark", 'html[data-theme="dark"]'],
	] as const;
	for (const [label, selector] of surfaces) {
		const card = hexVar(theme, selector, "bg-card");
		const link = hexVar(theme, selector, "link-color");
		const secondaryText = hexVar(theme, selector, "text-secondary");
		assertAa(link, card, `${label} outline-primary`);
		assertAa(card, link, `${label} outline-primary hover`);
		assertAa(secondaryText, card, `${label} outline-secondary`);
		assertAa(card, secondaryText, `${label} outline-secondary hover`);
	}
	const truenasCard = hexVar(globals, ".page-truenas", "truenas-card-bg");
	const truenasLink = hexVar(globals, ".page-truenas", "truenas-link");
	const truenasSecondary = hexVar(
		globals,
		".page-truenas",
		"truenas-text-secondary",
	);
	assertAa(truenasLink, truenasCard, "TrueNAS outline-primary");
	assertAa(truenasCard, truenasLink, "TrueNAS outline-primary hover");
	assertAa(truenasSecondary, truenasCard, "TrueNAS outline-secondary");
});

test("legacy wireframe colors no longer ship the low-contrast greys", async () => {
	const wireframe = await source("public/wireframe.css");
	assert.match(
		block(wireframe, ".btn-outline-primary"),
		/color: var\(--ui-link, #0b5ed7\);/,
	);
	assert.match(
		block(wireframe, ".btn-outline-secondary"),
		/color: var\(--ui-text-secondary, #475569\);/,
	);
	assert.match(block(wireframe, "a"), /color: var\(--ui-link, #0b5ed7\);/);
	assert.doesNotMatch(wireframe, /\.bg-info \{\s*background-color: #8e8e8e;/);
	assert.doesNotMatch(wireframe, /\.bg-info \{\s*color: #fff;/);
	assert.match(wireframe, /\.bg-info \{\s*color: #212529;/);
	assertAa("#212529", "#0dcaf0", "bg-info text");
});
