#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const iconDir = path.join(__dirname, "../public/assets/selfh-icons/");
const homelabJson = path.join(__dirname, "../public/homelab-services.json");
const outputFile = path.join(__dirname, "../missing-icons.json");
const cdnBase = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/";

const existing = new Set(fs.readdirSync(iconDir));
const services = JSON.parse(fs.readFileSync(homelabJson, "utf8")).services;
const missing = {};

for (const svc of services) {
	const icon = path.basename(svc.iconSrc);
	if (!existing.has(icon)) {
		const slug = icon.replace(".png", "");
		missing[icon] = cdnBase + slug + ".png";
	}
}
fs.writeFileSync(outputFile, JSON.stringify(missing, null, 2), "utf8");
console.log(
	`[OK] Missing icons JSON ready : ${outputFile} (${Object.keys(missing).length} files)`,
);
