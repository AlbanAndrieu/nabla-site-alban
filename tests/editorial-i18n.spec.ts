import { expect, test } from "@playwright/test";

test.describe("editorial page localization", () => {
	const metadataCases = [
		{
			pathname: "/fr/expertise.html",
			title: "Services et expertise technique — Alban Andrieu",
		},
		{
			pathname: "/fr/nabla.html",
			title: "Nabla — Homelab DevSecOps et plateforme cloud",
		},
		{
			pathname: "/fr/link.html",
			title: "Profils publics et registres — Alban Andrieu",
		},
		{
			pathname: "/fr/email.html",
			title: "Adresses email de contact — Alban Andrieu",
		},
		{
			pathname: "/fr/truenas.html",
			title: "Homelab et matériel TrueNAS Scale — Alban Andrieu",
		},
	] as const;

	for (const { pathname, title } of metadataCases) {
		test(`${pathname} uses localized metadata`, async ({ page }) => {
			await page.goto(pathname);
			await expect(page).toHaveTitle(title);
		});
	}

	test("the French links page keeps navigation in the active locale", async ({
		page,
	}) => {
		await page.goto("/fr/link.html");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Profils et registres utilisés",
		);
		await expect(
			page.getByRole("navigation", { name: "Fil d’Ariane" }).getByRole("link", {
				name: "Présentation de Nabla",
			}),
		).toHaveAttribute("href", "/fr/nabla.html");
		await expect(page.getByRole("contentinfo")).toHaveCount(1);
	});

	test("TrueNAS exposes a localized primary heading", async ({ page }) => {
		await page.goto("/fr/truenas.html");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Homelab et matériel TrueNAS Scale",
		);
		await expect(
			page.getByRole("heading", { name: "Services TrueNAS" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				name: "Homelab pour les projets de sécurité, d’IA et freelance",
			}),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "Ouvrir le projet Nabla" })).toHaveAttribute(
			"href",
			"/fr/nabla.html",
		);
		await expect(
			page.getByRole("heading", { name: "Outils et connexion" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Matériel", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("list", { name: "Usages de la plateforme" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Nomenclature du matériel" }),
		).toBeVisible();
		await expect(page.getByText("Prix total", { exact: true })).toBeVisible();
	});

	test("the email page renders structured mail links", async ({ page }) => {
		await page.goto("/fr/email.html");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Mise à jour de l’adresse email",
		);
		await expect(
			page.getByRole("link", { name: "security@albandrieu.com", exact: true }),
		).toHaveAttribute("href", "mailto:security@albandrieu.com");
		await expect(
			page.getByRole("link", { name: "invoice@albanandrieu.com", exact: true }),
		).toHaveCount(2);
	});

	test("CV and contact use localized accessible hero links", async ({ page }) => {
		await page.goto("/fr/cv");
		await expect(
			page.getByAltText(
				"Portrait d’Alban Andrieu, ingénieur DevSecOps et architecte cloud",
			),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /Me contacter/ })).toHaveAttribute(
			"href",
			"/fr/contact.html",
		);

		await page.goto("/fr/contact.html");
		await expect(page.getByRole("link", { name: /Voir mon CV/ })).toHaveAttribute(
			"href",
			"/fr/cv",
		);
	});

	test("Jus Mundi KPIs are localized in French", async ({ page }) => {
		await page.goto("/fr/jm");
		await expect(page).toHaveTitle(/Jusmundi — 4 ans d'impact/);
		await expect(page.getByText("Tâches réalisées", { exact: true })).toBeVisible();
		await expect(
			page.getByText("Réalisation majeure n°1", { exact: true }),
		).toBeVisible();
	});

	test("CTID description and image label are localized in French", async ({
		page,
	}) => {
		await page.goto("/fr/ctid.html");
		await expect(
			page.getByText(
				"Une sélection automatisée multi-sources pour la veille et la cyberdéfense.",
				{ exact: true },
			),
		).toBeVisible();
		await expect(
			page.getByRole("img", { name: "Emoji tête de mort et bouclier" }),
		).toBeVisible();
	});
});
