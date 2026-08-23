import Image from "next/image";
import { getTranslations } from "next-intl/server";

type Props = {
	locale: string;
};

export default async function HomeContactSection({ locale }: Props) {
	const t = await getTranslations({ locale, namespace: "home" });

	return (
		<section
			className="contact-section"
			id="contact"
			aria-labelledby="contact-heading"
		>
			<h2 className="section-title" id="contact-heading">
				{t("contact.title")}
			</h2>
			<p className="section-subtitle">{t("contact.subtitle")}</p>
			<div className="cta-buttons contact-hero-ctas">
				<a
					className="btn btn-primary"
					href="https://calendly.com/alban-andrieu"
					target="_blank"
					rel="noopener noreferrer"
				>
					<i className="fa fa-calendar-plus" /> {t("contact.cta.calendly")}
				</a>
				<a
					className="btn btn-secondary"
					href={`mailto:${t("contact.email.value")}`}
				>
					<i className="fas fa-envelope" /> {t("contact.cta.email")}
				</a>
			</div>
			<div className="contact-methods">
				<ContactMethod
					href={`mailto:${t("contact.email.value")}`}
					icon="fas fa-envelope"
					title={t("contact.email.label")}
					value={t("contact.email.value")}
				/>
				<ContactMethod
					href="https://www.linkedin.com/in/nabla"
					icon="fab fa-linkedin"
					title={t("contact.linkedin.label")}
					value={t("contact.linkedin.value")}
					external
				/>
				<ContactMethod
					href="https://calendly.com/alban-andrieu"
					icon="fa fa-calendar-plus"
					title={t("contact.calendly.label")}
					value={t("contact.calendly.value")}
					external
				/>
				<ContactMethod
					href="https://github.com/AlbanAndrieu"
					icon="fab fa-github"
					title={t("contact.github.label")}
					value={t("contact.github.value")}
					external
				/>
			</div>
			<div className="contact-logo-wrap">
				<Image
					alt={t("contact.logo.alt")}
					className="contact-logo"
					height={120}
					src="/assets/nabla/nabla-4.svg"
					width={120}
				/>
			</div>
		</section>
	);
}

function ContactMethod({
	href,
	icon,
	title,
	value,
	external = false,
}: {
	href: string;
	icon: string;
	title: string;
	value: string;
	external?: boolean;
}) {
	return (
		<a
			className="contact-method"
			href={href}
			{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
		>
			<div className="contact-icon">
				<i className={icon} />
			</div>
			<div className="contact-info">
				<h3>{title}</h3>
				<p>{value}</p>
			</div>
		</a>
	);
}
