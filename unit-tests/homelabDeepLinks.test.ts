import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookSource = await readFile(
	"app/components/homelab/useAnchoredDetails.ts",
	"utf8",
);
const serviceSource = await readFile(
	"app/components/homelab/ServiceTroubleshootingEvidence.tsx",
	"utf8",
);
const operationalSource = await readFile(
	"app/components/homelab/HomelabOperationalEvidence.tsx",
	"utf8",
);

test("delayed homelab details reveal themselves when their hash becomes active", () => {
	assert.match(hookSource, /window\.location\.hash === `#\$\{id\}`/);
	assert.match(hookSource, /window\.addEventListener\("hashchange"/);
	assert.match(hookSource, /setOpen\(true\)/);
	assert.match(hookSource, /scrollIntoView/);
});

test("service troubleshooting and pfSense evidence share delayed hash handling", () => {
	assert.match(serviceSource, /useAnchoredDetails\(detailsId\)/);
	assert.match(serviceSource, /open=\{anchoredDetails\.open\}/);
	assert.match(operationalSource, /"pfsense-operational-evidence"/);
	assert.match(operationalSource, /Boolean\(evidence\?\.pfsense\)/);
	assert.match(operationalSource, /open=\{pfsenseDetails\.open\}/);
});
