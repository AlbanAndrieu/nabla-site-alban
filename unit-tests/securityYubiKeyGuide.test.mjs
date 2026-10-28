import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const base = "app/[locale]/security/yubikey/";
const page = read(base + "page.tsx");
const graph = read(base + "YubiKeyGraph.tsx");
const model = read(base + "model.ts");
const copy = read(base + "content.ts");
const catalog = read("lib/sitePageCatalog.ts");
const resources = read("app/[locale]/security/securityResources.ts");

test("security links to localized public YubiKey route with sitemap metadata", () => {
  assert.match(catalog, /"security\/yubikey": \{/);
  assert.match(page, /canonicalPagePath\("security\/yubikey", locale as AppLocale\)/);
  assert.match(page, /canonicalPageAlternates\("security\/yubikey"\)/);
  assert.match(resources, /\{ page: "security\/yubikey", icon: "book" \}/);
  for (const locale of ["fr", "en"]) {
    const messages = JSON.parse(read(`messages/security/${locale}.json`));
    const personal = messages.securityPage.nativeSections.personal.links;
    assert.equal(personal.length, 4);
    assert.match(personal[3], /YubiKey/);
  }
});

test("architecture diagram is interactive with an accessible text alternative", () => {
  for (const label of ["primary", "backup", "webauthn", "ssh", "piv", "openpgp", "otp", "escrow", "recovery", "vault"]) {
    assert.match(model, new RegExp(`id: "${label}"`));
    assert.match(copy, new RegExp(`${label}: "`));
  }
  assert.match(graph, /<ReactFlow/);
  assert.match(graph, /onNodeClick=/);
  assert.match(graph, /<details/);
  assert.match(graph, /<summary>/);
  assert.match(graph, /zoomOnScroll=\{false\}/);
  assert.match(page, /<YubiKeyGraph copy=\{copy\} \/>/);
});

test("bilingual setup and glossary copy have matching technical terms", () => {
  for (const term of ["FIDO2", "WebAuthn", "CTAP", "SSH", "PIV", "PKCS#11", "GPG", "OpenPGP", "OTP", "HMAC", "SHA-1", "NFC", "PIN", "PUK", "CA", "age", "MFA", "SOPS", "OIDC", "IdP", "OATH", "TOTP", "TLS", "X.509", "SQL"]) {
    assert.equal(copy.split(`acronym: "${term}"`).length - 1, 2, term);
  }
  assert.match(copy, /state: "blocked"/);
  assert.match(copy, /state: "observed"/);
  assert.match(copy, /state: "planned"/);
  assert.match(page, /id="yubikey-glossary"/);
  assert.match(page, /id="yubikey-workflow"/);
});

test("public route never publishes device identifiers or credential material", () => {
  const all = [page, graph, model, copy].join("\n");
  assert.doesNotMatch(all, /(?:23501671|22916048|172\.17\.0\.|10\.254\.255\.)/);
  assert.doesNotMatch(all, /-----BEGIN (?:PRIVATE KEY|CERTIFICATE)-----/);
  assert.doesNotMatch(all, /\b(?:sk-proj-[A-Za-z0-9-]+|pinValue|pukValue|otpSecret|managementKeyValue)\b/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|fetch\(/);
  assert.match(copy, /without losing access/);
  assert.match(copy, /sans perdre l'accès/);
});

test("YubiKey use cases cover both locales and do not confuse hardware mechanisms", () => {
  const cases = read(base + "useCases.ts");
  const cards = read(base + "YubiKeyUseCases.tsx");
  const css = read(base + "page.module.css");
  const required = [
    "mfa-webauthn", "ssh-fido", "ssh-git-sign", "gpg-git",
    "sops-age", "sops-yubikey", "age-piv-plugin", "postgres-age", "gpg-backup-sign",
    "piv-certs", "vaultwarden", "hashicorp-vault", "keepassxc", "yubico-totp"
  ];
  for (const id of required) {
    assert.equal(cases.split(`"id": "${id}"`).length - 1, 2, id);
  }
  assert.match(page, /<YubiKeyUseCases locale=\{locale as AppLocale\} \/>/);
  assert.match(page, /href="#yubikey-use-cases"/);
  assert.match(cards, /<details/);
  assert.match(cards, /<pre className=\{styles\.command\} tabIndex=\{0\}/);
  assert.match(cards, /rel="noopener noreferrer"/);
  assert.match(css, /\.command:focus-visible/);
  assert.match(cases, /age-plugin-yubikey/);
  assert.match(cases, /gpg --verify/);
  assert.match(cases, /pg_dump -Fc/);
  assert.match(cases, /sops exec-env/);
  assert.match(cases, /SOPS_AGE_KEY_FILE/);
  assert.match(cases, /independent recovery recipient/);
  assert.doesNotMatch(cases, /age-plugin-yubikey --generate/);
  assert.doesNotMatch(cases, /(?:23501671|22916048|172\.17\.0\.|10\.254\.255\.|-----BEGIN PRIVATE KEY-----)/);
});

test("YubiKey inherits consistent header/footer Home and Back to Top icons", () => {
  const header = read("components/RouteHeader.tsx");
  const footer = read("app/components/Footer.tsx");
  const top = read("components/BackToTopButton.tsx");
  const layout = read("app/[locale]/layout.tsx");
  const fontAwesome = read("public/assets/fontawesome/css/fontawesome.css");
  assert.match(fontAwesome, /\.fa-home/);
  assert.match(fontAwesome, /\.fa-arrow-up/);
  assert.match(fontAwesome, /\.fa-arrow-left/);
  assert.match(layout, /<RouteHeader \/>/);
  assert.match(layout, /<Footer/);
  assert.match(header, /className="fas fa-home"/);
  assert.match(footer, /className="fas fa-home"/);
  assert.match(top, /className="fas fa-arrow-up"/);
  assert.match(top, /window\.scrollTo/);
  assert.match(page, /<TopAnchor \/>/);
  assert.match(page, /className="fa-solid fa-arrow-left"/);
  assert.match(header, /locale === "fr" \? "\/fr" : ""/);
});
