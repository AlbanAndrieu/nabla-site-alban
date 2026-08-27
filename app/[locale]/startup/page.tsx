import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/startup">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "startup" });

	return {
		title: t("meta.title"),
		description: t("meta.description"),
		alternates: {
			canonical: locale === "fr" ? "/fr/startup.html" : "/startup.html",
			languages: { en: "/startup.html", fr: "/fr/startup.html" },
		},
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function StartupPage({
	params,
}: PageProps<"/[locale]/startup">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const t = await getTranslations("startup");
	const localePrefix = locale === "fr" ? "/fr" : "";
	const homePath = localePrefix || "/";
	const contactPath = `${localePrefix}/contact.html`;
	const thanksUrl = `https://albanandrieu.com${localePrefix}/startup-thanks.html`;
	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<SkipToMainContent />
			<nav className="page-nav container py-3" aria-label="Breadcrumb">
				<a href={homePath} className="text-decoration-none">
					<i className="fas fa-home" aria-hidden="true"></i>{" "}
					{t("navigation.backHome")}
				</a>
				<span className="text-muted mx-2" aria-hidden="true">
					·
				</span>
				<a href={contactPath} className="text-decoration-none">
					{t("navigation.contact")}
				</a>
			</nav>
			<main
				id="main-content"
				role="main"
				className="container py-4 pb-5 col-lg-8"
			>
				<header className="mb-4">
					<h1 className="h2 mb-2">{t("hero.title")}</h1>
					<p className="lead text-secondary mb-0">
						{t("hero.beforeEmail")}
						<a href="mailto:job@albandrieu.com">job@albandrieu.com</a>.
						{t("hero.afterEmail")}
						<a
							href="https://calendly.com/alban-andrieu"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("hero.call")}
						</a>
						.
					</p>
				</header>
				<div className="card border-secondary bg-body-secondary shadow-sm">
					<div className="card-body p-4">
						<form
							className="startup-inquiry-form"
							action="https://formsubmit.co/job@albandrieu.com"
							method="post"
							aria-labelledby="startup-form-heading"
						>
							<h2 id="startup-form-heading" className="h5 mb-3">
								{t("form.heading")}
							</h2>
							<input type="hidden" name="_subject" value={t("form.subject")} />
							<input type="hidden" name="_next" value={thanksUrl} />
							<input type="hidden" name="_captcha" value="true" />
							<input type="hidden" name="_template" value="table" />
							<input
								type="text"
								name="_honey"
								value=""
								tabIndex={-1}
								autoComplete="off"
								aria-hidden="true"
								className="position-absolute"
								style={{
									left: "-9999px",
									width: "1px",
									height: "1px",
									opacity: 0,
								}}
								readOnly
							/>
							<div className="mb-3">
								<label htmlFor="startup-name" className="form-label">
									{t("form.name")} <span className="text-danger">*</span>
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-name"
									name="name"
									required
									autoComplete="name"
									placeholder={t("form.namePlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-email" className="form-label">
									{t("form.email")} <span className="text-danger">*</span>
								</label>
								<input
									type="email"
									className="form-control"
									id="startup-email"
									name="email"
									required
									autoComplete="email"
									placeholder={t("form.emailPlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-company" className="form-label">
									{t("form.company")}
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-company"
									name="company"
									autoComplete="organization"
									placeholder={t("form.companyPlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-context" className="form-label">
									{t("form.need")} <span className="text-danger">*</span>
								</label>
								<textarea
									className="form-control"
									id="startup-context"
									name="message"
									rows={6}
									required
									placeholder={t("form.needPlaceholder")}
								></textarea>
							</div>
							<p className="small text-secondary mb-3">
								{t("form.privacyBeforeLegal")}
								<a href="/policy/legal.html">{t("form.legal")}</a>{" "}
								{t("form.privacyConnector")}
								<a href="/policy/privacy_policy.html">{t("form.privacy")}</a>.
							</p>
							<button type="submit" className="btn btn-primary">
								<i className="fas fa-paper-plane" aria-hidden="true"></i>{" "}
								{t("form.submit")} job@albandrieu.com
							</button>
						</form>
					</div>
				</div>
			</main>
			<SiteWidgetsScript printPdf coffeeFab />
		</div>
	);
}
