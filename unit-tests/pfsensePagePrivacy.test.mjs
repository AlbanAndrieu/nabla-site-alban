import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// The public firewall write-up is a redacted summary of a private incident.
const FORBIDDEN = {
	ipv4: /\b\d{1,3}(?:\.\d{1,3}){3}\b/,
	urlPort: /https?:\/\/[^\s"'<>]+:\d{2,5}\b/,
	mac: /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/i,
	interfaceName: /\b(?:mvneta|igc|igb|ix|em|lagg|vtnet)\d+\b/,
	internalHost: /\.(?:lan|local|internal|home\.arpa)\b/,
	serverPath: /(?:\/mnt\/|\/cf\/conf|\/var\/|\/etc\/|config\.xml)/,
};

const sources = {
	"messages/fr.json": JSON.stringify(
		JSON.parse(read("messages/fr.json")).pfsensePage,
	),
	"messages/en.json": JSON.stringify(
		JSON.parse(read("messages/en.json")).pfsensePage,
	),
	"app/[locale]/pfsense/page.tsx": read("app/[locale]/pfsense/page.tsx"),
};

test("pfSense replacement page publishes no infrastructure identifiers", () => {
	for (const [path, content] of Object.entries(sources)) {
		assert.ok(content, `${path} must define the pfSense page content`);
		for (const [name, pattern] of Object.entries(FORBIDDEN)) {
			assert.doesNotMatch(content, pattern, `${path}: ${name}`);
		}
	}
});

test("pfSense replacement page cites only HTTPS sources", () => {
	const hrefs = [
		...sources["app/[locale]/pfsense/page.tsx"].matchAll(
			/"(https?:\/\/[^"]+)"/g,
		),
	].map(([, href]) => href);
	assert.equal(hrefs.length, 10);
	for (const href of hrefs) assert.match(href, /^https:\/\//);
});
