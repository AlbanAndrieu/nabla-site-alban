import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import Hero from "../../components/Hero";
import AnsibleHeroCard from "../../components/nabla/AnsibleHeroCard";
import CollaborateToolsSection from "../../components/nabla/CollaborateToolsSection";
import ContactSection from "../../components/nabla/ContactSection";
import DockerHeroCard from "../../components/nabla/DockerHeroCard";
import GoogleCSEClientOnly from "../../components/nabla/GoogleCSEClientOnly";
import NablaDevSecOpsHeroCard from "../../components/nabla/NablaDevSecOpsHeroCard";
import NablaPlatformsSection from "../../components/nabla/NablaPlatformsSection";
import ServiceCardsSection from "../../components/nabla/ServiceCardsSection";
import HardwareSection from "../../components/truenas/HardwareSection";
import BillOfMaterialsSection from "../../components/workstation/BillOfMaterialsSection";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/nabla">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "nabla.metadata" });

	return {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: canonicalPagePath("nabla", locale),
			languages: {
				en: canonicalPagePath("nabla", "en"),
				fr: canonicalPagePath("nabla", "fr"),
			},
		},
	};
}

// Type for NablaPlatformsSection
type Pillar = {
	title: string;
	icon: string;
	color: string;
	tools: { label: string; link?: string }[];
};

export default async function NablaPage({
	params,
}: PageProps<"/[locale]/nabla">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const site = await getTranslations("site");
	const nabla = await getTranslations("nabla");

	const nablaPillars: Pillar[] = [];

	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<main id="main-content" role="main" className="mb-5">
				{/* Hero Section */}
				<Hero />

				<CollaborateToolsSection
					heading={nabla("collaborate.heading")}
					subtitle={nabla("collaborate.subtitle")}
					tools={[
						{
							label: "Git",
							icon: "fab fa-git-alt",
							badge: "core",
							color: "#f34f29",
						},
						{
							label: "GitHub",
							icon: "fab fa-github",
							color: "#333",
							link: "https://github.com/AlbanAndrieu",
							badge: "open source",
						},
						{
							label: "GitLab",
							icon: "fab fa-gitlab",
							color: "#fc6d26",
							link: "https://gitlab.com/AlbanAndrieu",
						},
						{
							label: "Jira",
							icon: "fab fa-jira",
							color: "#0052cc",
							link: "https://www.atlassian.com/software/jira",
						},
						{
							label: "Asana",
							imageSrc: "/assets/selfh-icons/asana.png",
							imageAlt: "Asana",
							color: "#fc636b",
							link: "https://asana.com",
						},
						{
							label: "Slack",
							icon: "fab fa-slack",
							color: "#611f69",
							link: "https://slack.com",
						},
						{
							label: "Notion",
							imageSrc: "/assets/selfh-icons/notion.png",
							imageAlt: "Notion",
							color: "#000",
							link: "https://app.notion.com/p/albandrieu/Getting-Started-d588a6b720254a7baebd45357e8315a3",
							badge: "knowledge base",
						},
						{
							label: "Reactive Resume",
							imageSrc: "/assets/selfh-icons/rxresume.png",
							imageAlt: "RxResume",
							color: "#6c63ff",
							link: "https://reactive-resume.albandrieu.com",
							badge: "cv",
						},
					]}
				/>

				<section className="content-section">
					{/* Platforms & Tools Matrix */}
					<NablaPlatformsSection
						heading={nabla("platforms.heading")}
						intro1={nabla("platforms.intro1")}
						intro2={nabla("platforms.intro2")}
						logoSrc="/assets/nabla/nabla-4.svg"
						logoAlt="Nabla site logo"
						logoCtaLabel={nabla("platforms.logoCtaLabel")}
						logoCtaHref="/nabla"
						pillars={nablaPillars}
					/>

					{/* Open Source Contributions */}
					<AnsibleHeroCard
						title={nabla("opensource.ansible.title")}
						description={nabla("opensource.ansible.description")}
						linkLabel={nabla("opensource.ansible.linkLabel")}
						linkUrl="https://github.com/AlbanAndrieu"
						imageSrc="/assets/selfh-icons/ansible-icon.svg"
						imageAlt="Ansible logo"
					/>
					<NablaDevSecOpsHeroCard
						title={nabla("opensource.nabla.title")}
						description={nabla("opensource.nabla.description")}
						linkLabel={nabla("opensource.nabla.linkLabel")}
						linkUrl="#home"
					/>
					<DockerHeroCard
						title={nabla("opensource.docker.title")}
						description={nabla("opensource.docker.description")}
						linkLabel={nabla("opensource.docker.linkLabel")}
						linkUrl="https://hub.docker.com/u/nabla"
					/>

					{/* Services Grid */}
					<ServiceCardsSection
						services={[
							{
								icon: "fas fa-infinity",
								title: nabla("services.search.title"),
								description: nabla("services.search.description"),
								customContent: <GoogleCSEClientOnly />,
							},
							{
								icon: "fas fa-robot",
								title: nabla("services.iac.title"),
								description: nabla("services.iac.description"),
								customContent: (
									<div
										className="nabla-wip-callout"
										role="status"
										aria-live="polite"
									>
										<span
											className="nabla-wip-callout__icon"
											aria-hidden="true"
										>
											<i className="fas fa-screwdriver-wrench"></i>
										</span>
										<div>
											<strong>{nabla("services.iac.wipLabel")}</strong>{" "}
											{nabla("services.iac.wipDescription")}
										</div>
									</div>
								),
							},
							{
								icon: "fas fa-cloud",
								title: nabla("services.fastapi.title"),
								description: nabla("services.fastapi.description"),
								links: [
									{
										label: nabla("services.fastapi.openSample"),
										url: "https://fastapi-sample.fastapicloud.dev/api",
										icon: "fas fa-external-link-alt",
									},
									{
										label: nabla("services.fastapi.adminUI"),
										url: "https://dashboard.fastapicloud.com/albanandrieu-22237405/apps",
										icon: "fas fa-external-link-alt",
									},
									{
										label: nabla("services.fastapi.viewSource"),
										url: "https://gitlab.com/AlbanAndrieu/fastapi-sample",
										icon: "fab fa-gitlab",
									},
								],
							},
						]}
					/>
				</section>

				{/* Contact Section */}
				<ContactSection
					contacts={[
						{
							icon: "fas fa-envelope",
							label: nabla("contact.email.label"),
							value: nabla("contact.email.value"),
							href: nabla("contact.email.href"),
						},
						{
							icon: "fab fa-linkedin",
							label: nabla("contact.linkedin.label"),
							value: nabla("contact.linkedin.value"),
							href: nabla("contact.linkedin.href"),
							ariaLabel: "LinkedIn",
						},
						{
							icon: "fa fa-calendar-plus",
							label: nabla("contact.calendly.label"),
							value: nabla("contact.calendly.value"),
							href: nabla("contact.calendly.href"),
							ariaLabel: "Calendly",
						},
						{
							icon: "fab fa-github",
							label: nabla("contact.github.label"),
							value: nabla("contact.github.value"),
							href: nabla("contact.github.href"),
							ariaLabel: "GitHub",
						},
					]}
					logoSrc="/assets/nabla/nabla-4.svg"
				/>
			</main>
		</div>
	);
}
