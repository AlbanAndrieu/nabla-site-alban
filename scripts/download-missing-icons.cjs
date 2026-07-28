#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const https = require("https");

const missingIcons = require("../public/missing-icons.json");
const iconDir = path.join(__dirname, "../public/assets/selfh-icons/");
const fallback = path.join(__dirname, "generic-app.png");

function download(url, dest, fallbackPath) {
	return new Promise((resolve) => {
		const file = fs.createWriteStream(dest);
		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					file.close();
					if (fallbackPath && fs.existsSync(fallbackPath)) {
						fs.copyFileSync(fallbackPath, dest);
						resolve("fallback");
					} else {
						resolve("failed");
					}
					return;
				}
				response.pipe(file);
				file.on("finish", () => {
					file.close();
					resolve("ok");
				});
				response.on("error", () => {
					file.close();
					if (fallbackPath && fs.existsSync(fallbackPath)) {
						fs.copyFileSync(fallbackPath, dest);
						resolve("fallback");
					} else {
						resolve("failed");
					}
				});
			})
			.on("error", () => {
				file.close();
				if (fallbackPath && fs.existsSync(fallbackPath)) {
					fs.copyFileSync(fallbackPath, dest);
					resolve("fallback");
				} else {
					resolve("failed");
				}
			});
	});
}

(async () => {
	for (const [icon, url] of Object.entries(missingIcons)) {
		const out = path.join(iconDir, icon);
		if (fs.existsSync(out)) {
			console.log(`[EXISTS] ${icon}`);
			continue;
		}
		const result = await download(url, out, fallback);
		console.log(`[DOWNLOAD] ${icon} (${result}) from ${url}`);
		if (result === "failed") {
			console.warn(
				`[FAIL] ${icon}: Could not download nor fallback (no generic-app.png). Manual action needed.`,
			);
		}
	}
})();
