import { expect, test } from "@playwright/test";

// Liste des pages migrées à tester (ajoute/complète selon ton site)
const pagesToTest = [
	"/",
	"/ctid",
	"/freenas",
	"/truenas",
	"/test",
	"/ciso",
	"/nabla",
	"/login",
	"/ai",
	"/email",
	"/contact",
	"/expertise",
	"/checkout-tjm",
	"/checkout",
	"/startup",
	"/startup-thanks",
];
const locales = ["en", "fr"];

// Patterns d’erreur connus (i18n/Next.js/undefined)
const errorPatterns = [
	/map is not a function/i,
	/Cannot read property/i,
	/undefined/,
	/null/,
	/missing message/i,
	/Could not resolve/i,
	/TypeError/i,
	/(SSR|hydration) error/i,
];
test.describe("Site SSR/CSR migration - major console JS errors", () => {
	for (const page of pagesToTest) {
		for (const locale of locales) {
			const path = locale === "en" ? `/en${page}` : `/fr${page}`;
			test(`No JS error on ${path}`, async ({ page: p }) => {
				const errors: string[] = [];
				p.on("console", (msg) => {
					if (msg.type() === "error" || msg.type() === "warning")
						errors.push(msg.text());
				});
				await p.goto(path, { waitUntil: "domcontentloaded" });
				await p.waitForTimeout(300); // laisse finir l'hydratation
				const matching = errors.filter((err) =>
					errorPatterns.some((pattern) => pattern.test(err)),
				);
				expect(
					matching,
					`Page ${path} contains blocking JS errors:\n${matching.join("\n")}`,
				).toHaveLength(0);
			});
		}
	}
});
