import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const base = "app/[locale]/security/yubikey/";
const page = read(base + "page.tsx");
const guide = read(base + "TerraformYubiKeyApproval.tsx");

test("YubiKey page links to bilingual Terraform FIDO2 approval guide", () => {
  assert.match(page, /<TerraformYubiKeyApproval locale=\{locale as AppLocale\}/);
  assert.match(page, /href="#yubikey-terraform-approval"/);
  assert.match(guide, /id="yubikey-terraform-approval"/);
  assert.match(guide, /fr: \{/);
  assert.match(guide, /en: \{/);
  assert.match(guide, /ssh-keygen -Y sign -n nabla-entra-apply/);
  assert.match(guide, /90.minutes|90 minutes/);
  assert.match(guide, /github.com\/AlbanAndrieu\/nabla-compose\/pull\/410/);
});

test("Guide distinguishes approval from deployment and avoids secrets", () => {
  assert.match(guide, /no HCP\/Entra credentials/);
  assert.match(guide, /Aucune clé privée/);
  assert.doesNotMatch(guide, /gh workflow run/);
  assert.doesNotMatch(guide, /ARM_CLIENT_SECRET|HCP_TF_TOKEN|private key PEM/);
});
