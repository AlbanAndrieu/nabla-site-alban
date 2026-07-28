import Script from "next/script";
import { getTranslations, setRequestLocale } from "next-intl/server";


export default async function EmailPage({
	params,
}: {
	params: { locale: string };
}) {
	const { locale } = params;
	setRequestLocale(locale);
	const t = await getTranslations("email");
	const tSite = await getTranslations("site");
	const cards = t.raw("cards") as { title: string; desc: string }[];
	const automatedList: string[] = t.raw("automatedList") as string[];
	return (
		<div className="site-content-page page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				{tSite("skipToMainContent")}
			</a>
			<main id="main-content" className="container py-4 pb-5">
				<header className="mb-4">
					<h1 className="h2 mb-2">{t("title")}</h1>
					<p className="lead text-secondary mb-0">
						{t("reasonLine1")} <strong>alban.andrieu@free.fr</strong>{" "}
						{t("reasonLine2")}{" "}
						<a
							href="https://support.google.com/mail/answer/16604719"
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("reasonLine3")}
						</a>
						{t("reasonLine4")}
					</p>
				</header>
				<section className="py-3" aria-labelledby="preferred-addresses-heading">
					<h2 id="preferred-addresses-heading" className="h4 mb-3">
						{t("useTheseAddresses")}
					</h2>
					<div className="row g-3">
{cards.map((card) => (
									<div key={card.title} className="col-md-6">
								<div className="card h-100 bg-body-secondary border-secondary">
									<div className="card-body">
										<h3 className="h6 card-title">{card.title}</h3>
										<p
											className="card-text mb-0"
											dangerouslySetInnerHTML={{ __html: card.desc }}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
				<section className="py-3" aria-labelledby="automated-senders-heading">
					<h2 id="automated-senders-heading" className="h4 mb-3">
						{t("automatedHeading")}
					</h2>
					<div className="card border-warning bg-body-secondary">
						<div className="card-body">
							<p className="mb-2">{t("automatedDesc")}</p>
							<ul className="mb-0">
								{automatedList.map((item) => (
									<li key={item} dangerouslySetInnerHTML={{ __html: item }} />
								))}
							</ul>
						</div>
					</div>
				</section>
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
