import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/docker-build.yml",
  import.meta.url,
);

test("Docker CI always publishes validated master images to GHCR", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /Publish validated fallback image to GHCR/);
  assert.match(workflow, /docker push "\$\{GHCR_IMAGE\}:latest"/);
  assert.match(workflow, /docker push "\$\{GHCR_IMAGE\}:\$\{GITHUB_SHA\}"/);
  assert.match(workflow, /packages:\s*write/);
});

test("Docker Hub publication is optional when credentials are absent", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /Resolve registry publication policy/);
  assert.match(workflow, /dockerhub_enabled=false/);
  assert.match(
    workflow,
    /Docker Hub credentials are not configured; publishing the validated image to GHCR only/,
  );

  const loginStart = workflow.indexOf("      - name: Login to Docker Hub");
  const loginEnd = workflow.indexOf(
    "      - name: Login to GitHub Container Registry",
  );
  const publishStart = workflow.indexOf(
    "      - name: Publish validated fallback image to Docker Hub",
  );
  const imageDigestStart = workflow.indexOf("      - name: Image digest");

  assert.ok(loginStart >= 0 && loginEnd > loginStart);
  assert.ok(publishStart >= 0 && imageDigestStart > publishStart);

  const loginStep = workflow.slice(loginStart, loginEnd);
  const publishStep = workflow.slice(publishStart, imageDigestStart);

  assert.match(
    loginStep,
    /steps\.registry_policy\.outputs\.dockerhub_enabled == 'true'/,
  );
  assert.match(
    publishStep,
    /steps\.registry_policy\.outputs\.dockerhub_enabled == 'true'/,
  );
});
