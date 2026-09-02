import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("pfSense degraded or stale evidence surfaces diagnostic actions", async () => {
	const actions = await source(
		"app/components/homelab/PfSenseAttentionActions.tsx",
	);
	const evidence = await source(
		"app/components/homelab/HomelabOperationalEvidence.tsx",
	);
	const messages = JSON.parse(await source("messages/operations/en.json"));

	assert.match(actions, /component\.state !== "ok"/);
	assert.match(actions, /component\.stale === true/);
	assert.match(actions, /focus\.startsWith\("pfsense_"\)/);
	assert.match(actions, /data-pfsense-attention-actions/);
	assert.match(actions, /#pfsense-operational-evidence/);
	assert.match(actions, /https:\/\/pfsense\.albandrieu\.com:10443\//);
	assert.match(actions, /\/api\/v2\/system\/version/);
	assert.match(evidence, /<PfSenseAttentionActions/);
	assert.match(evidence, /id="pfsense-operational-evidence"/);
	assert.equal(messages.operations.pfsense.details, "Inspect pfSense evidence");
	assert.equal(messages.operations.pfsense.actions.admin, "pfSense Admin");
	assert.equal(messages.operations.pfsense.actions.api, "pfSense API health");
});

test("pfSense management links remain explicitly diagnostic rather than causal proof", async () => {
	const en = JSON.parse(await source("messages/operations/en.json"));
	const fr = JSON.parse(await source("messages/operations/fr.json"));

	assert.match(en.operations.pfsense.actions.note, /not proof/i);
	assert.match(fr.operations.pfsense.actions.note, /pas une preuve/i);
});
