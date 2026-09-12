import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cardPath = new URL("../components/ui/Card.tsx", import.meta.url);
const cardStylesPath = new URL(
	"../components/ui/Card.module.css",
	import.meta.url,
);
const nablaCardStylesPath = new URL(
	"../app/components/nabla/NablaHeroCard.module.css",
	import.meta.url,
);
const consumerPaths = [
	"../app/components/nabla/DockerHeroCard.tsx",
	"../app/components/nabla/AnsibleHeroCard.tsx",
	"../app/components/nabla/NablaDevSecOpsHeroCard.tsx",
].map((path) => new URL(path, import.meta.url));

test("Card owns the shared tokenized surface and body contract", async () => {
	const [card, styles] = await Promise.all([
		readFile(cardPath, "utf8"),
		readFile(cardStylesPath, "utf8"),
	]);

	assert.match(card, /ComponentPropsWithoutRef<"div">/);
	assert.match(card, /borderless\?: boolean/);
	assert.match(card, /elevated\?: boolean/);
	assert.match(card, /export function CardBody/);
	assert.match(styles, /background: var\(--ui-surface-card\)/);
	assert.match(styles, /border: 1px solid var\(--ui-border\)/);
	assert.match(styles, /border-radius: var\(--ui-radius-card\)/);
	assert.match(styles, /box-shadow: var\(--ui-shadow-sm\)/);
});

test("Nabla hero cards own their layout instead of Bootstrap card/layout primitives", async () => {
	const [consumers, layoutStyles] = await Promise.all([
		Promise.all(consumerPaths.map((path) => readFile(path, "utf8"))),
		readFile(nablaCardStylesPath, "utf8"),
	]);

	assert.match(layoutStyles, /width: min\(100%, 25rem\)/);
	assert.match(layoutStyles, /color: var\(--ui-text-muted\)/);
	assert.match(layoutStyles, /margin-bottom: 3rem/);

	for (const source of consumers) {
		assert.match(
			source,
			/import Card, \{ CardBody \} from "@\/components\/ui\/Card"/,
		);
		assert.match(source, /import styles from "\.\/NablaHeroCard\.module\.css"/);
		assert.match(source, /<Card[\s\S]*?borderless[\s\S]*?elevated/);
		assert.match(source, /data-nabla-hero-card=/);
		assert.match(source, /<CardBody className=\{styles\.body\}>/);
		assert.doesNotMatch(source, /className="card shadow border-0"/);
		assert.doesNotMatch(source, /className="card-body/);
		assert.doesNotMatch(
			source,
			/className="(?:d-flex|text-center|h5|card-text|w-100|mb-|mt-|ms-|me-|pt-|pb-)/,
		);
		assert.doesNotMatch(source, /style=\{\{/);
	}
});
