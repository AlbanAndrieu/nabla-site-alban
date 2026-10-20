import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
	new URL("../.github/workflows/nuclei-public.yml", import.meta.url),
	"utf8",
);
const documentation = readFileSync(
	new URL("../docs/nuclei-security-scan.md", import.meta.url),
	"utf8",
);

test("Nuclei production scan is scheduled or manually dispatched, never on push/PR", () => {
	const triggers = workflow.split(/^permissions:/m)[0];
	assert.match(triggers, /^ {2}workflow_dispatch:$/m);
	assert.match(triggers, /^ {2}schedule:$/m);
	assert.doesNotMatch(
		triggers,
		/^ {2}(?:push|pull_request|pull_request_target):$/m,
	);
	assert.match(workflow, /timeout-minutes: 15/);
	assert.match(workflow, /-rl 2 -c 1 -timeout 5 -retries 0/);
	assert.match(workflow, /-tags cve,misconfig,exposure/);
	assert.match(workflow, /-severity medium,high,critical/);
	assert.match(workflow, /-etags dos,fuzz,bruteforce,intrusive/);
	assert.match(workflow, /-pt http -ni/);
});

test("DefectDojo is never pushed to the internal LAN from public GitHub runners", () => {
	assert.doesNotMatch(workflow, /DEFECTDOJO_API_TOKEN|CF_ACCESS_CLIENT_SECRET/);
	assert.doesNotMatch(workflow, /reimport-scan|\/api\/v2\/findings/);
	assert.match(workflow, /read-only TrueNAS collector pulls approved master/);
	assert.match(workflow, /INCOMPLETE \/ NOT_RUN/);
	assert.match(workflow, /retention-days: 3/);
});

test("Documentation describes actual scan cadence and incomplete result semantics", () => {
	assert.match(documentation, /chaque lundi à 04:19 UTC/);
	assert.match(documentation, /INCOMPLETE \/ NOT_RUN/);
	assert.match(
		documentation,
		/aucun scan sur push|n'entraînent pas de scan sur push/,
	);
});
