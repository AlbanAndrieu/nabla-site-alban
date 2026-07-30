import assert from "node:assert/strict";
import test from "node:test";

import {
  loadCvHtmlFragment,
  metadataFromCvHtml,
  resolveCvPublicFilePath,
} from "../lib/cvFromPublic";

test("resolveCvPublicFilePath only resolves allowlisted CV documents", async () => {
  assert.match(
    (await resolveCvPublicFilePath(["cv-small-en.html"], "en")) ?? "",
    /public\/cv\/cv-small-en\.html$/,
  );
  assert.equal(
    await resolveCvPublicFilePath(["..", "package.json"], "en"),
    null,
  );
});

test("loadCvHtmlFragment extracts the body and removes legacy navigation", async () => {
  const { file, html } = await loadCvHtmlFragment(["cv-small-en.html"], "en");

  assert.equal(file, "cv/cv-small-en.html");
  assert.doesNotMatch(html, /<body\b/i);
  assert.doesNotMatch(html, /<nav\b[^>]*\bpage-nav\b/i);
  assert.match(html, /Alban Andrieu/i);
});

test("metadataFromCvHtml exposes the requested canonical URL", async () => {
  const metadata = await metadataFromCvHtml(
    ["cv-small-fr.html"],
    "/fr/cv/cv-small-fr.html",
    "fr",
  );

  assert.equal(
    metadata.alternates?.canonical,
    "https://albanandrieu.com/fr/cv/cv-small-fr.html",
  );
});
