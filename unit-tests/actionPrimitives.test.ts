import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actionLinkPath = new URL(
	"../components/ui/ActionLink.tsx",
	import.meta.url,
);
const buttonPath = new URL("../components/ui/Button.tsx", import.meta.url);
const actionStylesPath = new URL(
	"../components/ui/Action.module.css",
	import.meta.url,
);
const startupPath = new URL(
	"../app/[locale]/startup/page.tsx",
	import.meta.url,
);
const startupThanksPath = new URL(
	"../app/[locale]/startup-thanks/page.tsx",
	import.meta.url,
);
const threatFeedPath = new URL(
	"../components/ciso/ThreatFeed.tsx",
	import.meta.url,
);

test("link and button actions share the tokenized action style contract", async () => {
	const [actionLink, button, styles] = await Promise.all([
		readFile(actionLinkPath, "utf8"),
		readFile(buttonPath, "utf8"),
		readFile(actionStylesPath, "utf8"),
	]);

	assert.match(actionLink, /export type ActionVariant/);
	assert.match(actionLink, /export type ActionSize/);
	assert.match(actionLink, /actionClassName\(variant, size, className\)/);
	assert.match(button, /ComponentPropsWithoutRef<"button">/);
	assert.match(button, /type = "button"/);
	assert.match(button, /actionClassName\(variant, size, className\)/);
	assert.match(styles, /min-height: var\(--ui-control-min-height\)/);
	assert.match(styles, /outline: 3px solid var\(--ui-focus-ring\)/);
});

test("migrated active actions no longer depend on Bootstrap button classes", async () => {
	const [startup, startupThanks, threatFeed] = await Promise.all([
		readFile(startupPath, "utf8"),
		readFile(startupThanksPath, "utf8"),
		readFile(threatFeedPath, "utf8"),
	]);

	assert.match(startup, /import Button from "@\/components\/ui\/Button"/);
	assert.match(startup, /<Button type="submit">/);
	assert.doesNotMatch(startup, /className="btn btn-primary"/);

	assert.match(startupThanks, /import ActionLink from/);
	assert.match(startupThanks, /<ActionLink href=\{homePath\}>/);
	assert.match(startupThanks, /variant="outline"/);
	assert.doesNotMatch(startupThanks, /className="btn /);

	assert.match(threatFeed, /import Button from "@\/components\/ui\/Button"/);
	assert.match(threatFeed, /size="compact"/);
	assert.match(threatFeed, /variant="outline"/);
	assert.doesNotMatch(threatFeed, /className="btn btn-outline-primary btn-sm"/);
});
