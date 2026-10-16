import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/nuclei-public.yml", import.meta.url), "utf8");
const documentation = readFileSync(new URL("../docs/nuclei-security-scan.md", import.meta.url), "utf8");

test("Nuclei production scan is scheduled or manually dispatched, never on push/PR", () => {
  const triggers = workflow.split(/^permissions:/m)[0];
  assert.match(triggers, /^  workflow_dispatch:$/m);
  assert.match(triggers, /^  schedule:$/m);
  assert.doesNotMatch(triggers, /^  (?:push|pull_request|pull_request_target):$/m);
  assert.match(workflow, /timeout-minutes: 15/);
  assert.match(workflow, /-rl 2 -c 1 -timeout 5 -retries 0/);
  assert.match(workflow, /-tags cve,misconfig,exposure/);
  assert.match(workflow, /-severity medium,high,critical/);
  assert.match(workflow, /-etags dos,fuzz,bruteforce,intrusive/);
  assert.match(workflow, /-pt http -ni/);
});

test("DefectDojo is restricted to complete master scans with explicit Access credentials", () => {
  const guards = workflow.match(/if: steps\.nuclei\.outcome == 'success' && github\.ref == 'refs\/heads\/master'/g) ?? [];
  assert.equal(guards.length, 2, "both import and readback must be guarded");
  assert.match(workflow, /CF_ACCESS_CLIENT_SECRET/);
  assert.match(workflow, /DEFECTDOJO_PRODUCT_NAME/);
  assert.match(workflow, /INCOMPLETE \/ NOT_RUN/);
});

test("Documentation describes actual scan cadence and incomplete result semantics", () => {
  assert.match(documentation, /chaque lundi à 04:19 UTC/);
  assert.match(documentation, /INCOMPLETE \/ NOT_RUN/);
  assert.match(documentation, /aucun scan sur push|n'entraînent pas de scan sur push/);
});
