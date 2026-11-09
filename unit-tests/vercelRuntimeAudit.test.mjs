import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { assessRuntimeTopology, auditRuntime, PUBLIC_PAGE_GROUPS } from "../scripts/audit-vercel-runtime.mjs";

function manifestForAllPages() {
  return {
    version: 4,
    routes: Object.fromEntries(Object.values(PUBLIC_PAGE_GROUPS)
      .flatMap((locales) => Object.values(locales).map((aliases) => [
        aliases.at(-1), { initialRevalidateSeconds: false },
      ]))),
    dynamicRoutes: { "/api/homelab-health": {} },
  };
}

test("audits EN/FR static routes without treating dynamic APIs as cached", () => {
  const report = assessRuntimeTopology(manifestForAllPages());
  assert.equal(report.status, "PASS");
  assert.equal(report.verified.length, 10);
  assert.deepEqual(report.privatePrerendered, []);
});

test("accepts unprefixed EN homepage and warns about missing FR page", () => {
  const manifest = manifestForAllPages();
  manifest.routes["/"] = manifest.routes["/en"];
  delete manifest.routes["/en"];
  delete manifest.routes["/fr/security"];
  const report = assessRuntimeTopology(manifest);
  assert.equal(report.status, "WARN");
  assert.deepEqual(report.missing, ["security:fr"]);
});

test("ISR public pages are not claimed to have zero compute cost", () => {
  const manifest = manifestForAllPages();
  manifest.routes["/en/security"].initialRevalidateSeconds = 60;
  const report = assessRuntimeTopology(manifest);
  assert.equal(report.status, "WARN");
  assert.deepEqual(report.revalidatingPublic, ["security:en"]);
});

test("private homelab API prerendering fails closed even when public pages pass", () => {
  const manifest = manifestForAllPages();
  manifest.routes["/api/homelab-health-v2"] = { initialRevalidateSeconds: 30 };
  const report = assessRuntimeTopology(manifest);
  assert.equal(report.status, "FAIL");
  assert.deepEqual(report.privatePrerendered, ["/api/homelab-health-v2"]);
});

test("Vercel function artifacts for public routes require review", () => {
  const report = assessRuntimeTopology(manifestForAllPages(), ["/en/security", "/api/homelab-health"]);
  assert.equal(report.status, "WARN");
  assert.deepEqual(report.publicFunctions, ["/en/security"]);
});

test("missing and malformed Next build artifacts never report PASS", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "site-vercel-audit-"));
  try {
    const manifestPath = path.join(dir, "prerender-manifest.json");
    const functionsDirectory = path.join(dir, "functions");
    const missing = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(missing.status, "NOT_RUN");
    await writeFile(manifestPath, "not-json");
    const malformed = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(malformed.status, "FAIL");
    await writeFile(manifestPath, JSON.stringify(manifestForAllPages()));
    await mkdir(path.join(functionsDirectory, "en", "security.func"), { recursive: true });
    const present = await auditRuntime({ manifestPath, functionsDirectory });
    assert.equal(present.status, "WARN");
    assert.equal(present.functionsPresent, true);
    assert.deepEqual(present.publicFunctions, ["/en/security"]);
    assert.equal(present.cpuMeasured, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CLI returns NOT_RUN exit 2 when there is no Next build", () => {
  const dir = path.resolve(import.meta.dirname, "..");
  const child = spawnSync(process.execPath, [path.join(dir, "scripts/audit-vercel-runtime.mjs"), "--json"], {
    cwd: tmpdir(), encoding: "utf8",
  });
  assert.equal(child.status, 2);
  assert.equal(JSON.parse(child.stdout).status, "NOT_RUN");
});
