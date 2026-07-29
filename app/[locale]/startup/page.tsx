import Script from "next/script";
import { getTranslations } from "next-intl/server";

export default async function StartupPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "startupPage" });
	const localePrefix = locale === "fr" ? "/fr" : "";

	return (
		<div className="site-content-page page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				{t("skipToMain")}
			</a>
			<nav className="page-nav container py-3" aria-label="Breadcrumb">
				<a href={`${localePrefix}/`} className="text-decoration-none">
					<i className="fas fa-home" aria-hidden="true"></i>{" "}
					{t("backHome")}
				</a>
				<span className="text-muted mx-2" aria-hidden="true">
					·
				</span>
				<a href={`${localePrefix}/contact`} className="text-decoration-none">
					{t("contact")}
				</a>
			</nav>
			<main
				id="main-content"
				role="main"
				className="container py-4 pb-5 col-lg-8"
			>
				<header className="mb-4">
					<h1 className="h2 mb-2">{t("title")}</h1>
					<p className="lead text-secondary mb-0">
						{t("intro")}{" "}
						<a href="mailto:job@albandrieu.com">job@albandrieu.com</a>.{" "}
						{t("or")}{" "}
						<a
							href="https://calendly.com/alban-andrieu"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("bookCall")}
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
								{t("formTitle")}
							</h2>
							<input
								type="hidden"
								name="_subject"
								value="[albanandrieu.com] Startup / project inquiry"
							/>
							<input
								type="hidden"
								name="_next"
								value={`https://albanandrieu.com${localePrefix}/startup-thanks.html`}
							/>
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
									{t("name")} <span className="text-danger">*</span>
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-name"
									name="name"
									required
									autoComplete="name"
									placeholder={t("namePlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-email" className="form-label">
									{t("email")} <span className="text-danger">*</span>
								</label>
								<input
									type="email"
									className="form-control"
									id="startup-email"
									name="email"
									required
									autoComplete="email"
									placeholder={t("emailPlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-company" className="form-label">
									{t("company")}
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-company"
									name="company"
									autoComplete="organization"
									placeholder={t("companyPlaceholder")}
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-context" className="form-label">
									{t("need")}{" "}
									<span className="text-danger">*</span>
								</label>
								<textarea
									className="form-control"
									id="startup-context"
									name="message"
									rows={6}
									required
									placeholder={t("needPlaceholder")}
								></textarea>
							</div>
							<p className="small text-secondary mb-3">
								{t("privacyPrefix")}{" "}
								<a href="/policy/legal.html">{t("legal")}</a> {t("and")}{" "}
								<a href="/policy/privacy_policy.html">{t("privacy")}</a>.
							</p>
							<button type="submit" className="btn btn-primary">
								<i className="fas fa-paper-plane" aria-hidden="true"></i>{" "}
								{t("submit")}
							</button>
						</form>
					</div>
				</div>
			</main>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-print-pdf=""
				data-coffee-fab=""
			/>
		</div>
	);
}
