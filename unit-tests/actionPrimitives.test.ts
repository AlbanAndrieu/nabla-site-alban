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
const heroPath = new URL("../app/components/Hero.tsx", import.meta.url);
const homeContactPath = new URL(
	"../app/components/home/HomeContactSection.tsx",
	import.meta.url,
);
const pricingPath = new URL(
	"../app/[locale]/pricing/page.tsx",
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
	assert.match(actionLink, /"outlineSecondary"/);
	assert.match(actionLink, /"inverted"/);
	assert.match(actionLink, /actionClassName\(variant, size, className\)/);
	assert.match(button, /ComponentPropsWithoutRef<"button">/);
	assert.match(button, /type = "button"/);
	assert.match(button, /actionClassName\(variant, size, className\)/);
	assert.match(styles, /min-height: var\(--ui-control-min-height\)/);
	assert.match(styles, /outline: 3px solid var\(--ui-focus-ring\)/);
	assert.match(styles, /\.inverted \{/);
	assert.match(styles, /\.outlineSecondary \{/);
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

test("homepage and pricing CTA links use the shared action primitive", async () => {
	const [hero, homeContact, pricing] = await Promise.all([
		readFile(heroPath, "utf8"),
		readFile(homeContactPath, "utf8"),
		readFile(pricingPath, "utf8"),
	]);

	assert.match(hero, /import ActionLink from/);
	assert.match(hero, /variant="inverted"/);
	assert.match(hero, /variant="secondary"/);
	assert.doesNotMatch(hero, /className="btn /);

	assert.match(homeContact, /import ActionLink from/);
	assert.match(homeContact, /variant="secondary"/);
	assert.doesNotMatch(homeContact, /className="btn /);

	assert.match(pricing, /import ActionLink from/);
	assert.match(pricing, /size="compact"/);
	assert.match(pricing, /variant="outline"/);
	assert.match(pricing, /variant="outlineSecondary"/);
	assert.doesNotMatch(pricing, /className="btn /);
});
