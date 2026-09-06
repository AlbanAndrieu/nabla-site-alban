import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type ThemeVars = Record<string, string>;

function selectorBlock(css: string, selector: string): string {
	const start = css.indexOf(selector);
	assert.ok(start >= 0, "Missing CSS block for " + selector);
	const open = css.indexOf("{", start);
	const close = css.indexOf("}", open);
	assert.ok(open >= 0 && close > open, "Invalid CSS block for " + selector);
	return css.slice(open + 1, close);
}

function hexVariables(block: string): ThemeVars {
	return Object.fromEntries(
		Array.from(
			block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi),
			([, name, value]) => [name, value.toLowerCase()],
		),
	);
}

function channel(value: string): number {
	const normalized = Number.parseInt(value, 16) / 255;
	return normalized <= 0.04045
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
	const value = hex.replace("#", "");
	assert.equal(value.length, 6, "Expected six-digit hex, received " + hex);
	const red = channel(value.slice(0, 2));
	const green = channel(value.slice(2, 4));
	const blue = channel(value.slice(4, 6));
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
	const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
		(left, right) => right - left,
	);
	return (lighter + 0.05) / (darker + 0.05);
}

function requireAa(
	variables: ThemeVars,
	foreground: string,
	background: string,
	label: string,
) {
	const foregroundValue = variables[foreground];
	const backgroundValue = variables[background];
	assert.ok(foregroundValue, "Missing --" + foreground);
	assert.ok(backgroundValue, "Missing --" + background);
	const ratio = contrastRatio(foregroundValue, backgroundValue);
	assert.ok(
		ratio >= 4.5,
		label + ": " + foregroundValue + " on " + backgroundValue + " = " + ratio.toFixed(2) + ":1, expected >= 4.5:1",
	);
}

function assertThemeTextContrast(variables: ThemeVars, label: string) {
	requireAa(variables, "text-primary", "bg-primary", label + " primary text");
	requireAa(variables, "text-secondary", "bg-primary", label + " secondary text");
	requireAa(variables, "text-muted", "bg-primary", label + " muted text");
	requireAa(variables, "link-color", "bg-primary", label + " links");
	requireAa(variables, "button-text", "button-bg", label + " primary buttons");
	requireAa(variables, "toggle-segment-muted", "toggle-track-bg", label + " inactive theme segment");
	requireAa(variables, "alert-info-text", "alert-info-bg", label + " info alert");
	requireAa(variables, "alert-success-text", "alert-success-bg", label + " success alert");
	requireAa(variables, "alert-warning-text", "alert-warning-bg", label + " warning alert");
}

test("shared light and dark theme text tokens meet WCAG AA contrast", async () => {
	const css = await readFile(new URL("../public/theme.css", import.meta.url), "utf8");
	const defaultLight = hexVariables(selectorBlock(css, ":root"));
	const manualLight = hexVariables(selectorBlock(css, 'html[data-theme="light"]'));
	const manualDark = hexVariables(selectorBlock(css, 'html[data-theme="dark"]'));

	assertThemeTextContrast(defaultLight, "default light");
	assertThemeTextContrast(manualLight, "manual light");
	assertThemeTextContrast(manualDark, "manual dark");
});
