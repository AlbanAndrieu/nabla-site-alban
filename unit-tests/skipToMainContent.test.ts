import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const priorityRoutes = [
  "../app/[locale]/page.tsx",
  "../app/[locale]/ai/page.tsx",
  "../app/[locale]/truenas/page.tsx",
  "../app/[locale]/workstation/page.tsx",
] as const;

for (const route of priorityRoutes) {
  test(`${route} uses the shared skip-to-main component`, async () => {
    const source = await readFile(new URL(route, import.meta.url), "utf8");

    assert.match(source, /SkipToMainContent/);
    assert.doesNotMatch(source, /<a href="#main-content" className="skip-to-main">/);
  });
}
