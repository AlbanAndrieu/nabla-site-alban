import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const badgePath = new URL("../components/ui/Badge.tsx", import.meta.url);
const badgeStylesPath = new URL(
	"../components/ui/Badge.module.css",
	import.meta.url,
);
const actionLinkPath = new URL(
	"../components/ui/ActionLink.tsx",
	import.meta.url,
);
const designTokensPath = new URL("../app/design-tokens.css", import.meta.url);
const consumerPaths = [
	"../app/components/nabla/DockerHeroCard.tsx",
	"../app/components/nabla/AnsibleHeroCard.tsx",
	"../app/components/nabla/NablaDevSecOpsHeroCard.tsx",
].map((path) => new URL(path, import.meta.url));

test("Badge uses semantic, theme-backed variants", async () => {
	const [badge, styles, tokens] = await Promise.all([
		readFile(badgePath, "utf8"),
		readFile(badgeStylesPath, "utf8"),
		readFile(designTokensPath, "utf8"),
	]);

	assert.match(badge, /ComponentPropsWithoutRef<"span">/);
	assert.match(badge, /"info" \| "success" \| "primary"/);
	assert.match(styles, /background: var\(--ui-info-surface\)/);
	assert.match(styles, /color: var\(--ui-info-text\)/);
	assert.match(styles, /background: var\(--ui-success-surface\)/);
	assert.match(styles, /background: var\(--ui-primary-bg\)/);
	assert.match(tokens, /--ui-info-surface: var\(--alert-info-bg/);
	assert.match(tokens, /--ui-info-border: var\(--alert-info-border/);
	assert.match(tokens, /--ui-info-text: var\(--alert-info-text/);
});

test("Nabla hero badges and CTAs no longer use Bootstrap badge/button primitives", async () => {
	const [docker, ansible, devSecOps, actionLink] = await Promise.all([
		...consumerPaths.map((path) => readFile(path, "utf8")),
		readFile(actionLinkPath, "utf8"),
	]);

	for (const source of [docker, ansible, devSecOps]) {
		assert.match(
			source,
			/import ActionLink from "@\/components\/ui\/ActionLink"/,
		);
		assert.match(source, /import Badge from "@\/components\/ui\/Badge"/);
		assert.doesNotMatch(source, /className="badge /);
		assert.doesNotMatch(source, /className="btn /);
	}

	assert.match(
		docker,
		/<Badge className=\{styles\.inlineBadge\} variant="info">/,
	);
	assert.match(docker, /variant="outlineInfo"/);
	assert.match(
		ansible,
		/<Badge className=\{styles\.stackedBadge\} variant="success">/,
	);
	assert.match(ansible, /variant="outline"/);
	assert.match(devSecOps, /<Badge className=\{styles\.inlineBadge\}>/);
	assert.match(devSecOps, /variant="outline"/);
	assert.match(actionLink, /\| "outlineInfo"/);
});
