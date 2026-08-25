import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

type Props = {
	locale: string;
};

export default async function HomeTimelineSection({ locale }: Props) {
	const t = await getTranslations({ locale, namespace: "home" });
	const prefix = locale === "fr" ? "/fr" : "";

	return (
		<section className="timeline-section" aria-labelledby="timeline">
			<br />
			<AnchoredHeading className="section-title" id="timeline">
				{t("timeline.title")}
			</AnchoredHeading>
			<p className="section-subtitle">{t("timeline.subtitle")}</p>
			<div className="timeline">
				<TimelineItem
					icon="fa-briefcase"
					date={t("timeline.freelance.date")}
					title={t("timeline.freelance.title")}
				>
					<p className="timeline-description">{t("timeline.freelance.desc")}</p>
				</TimelineItem>

				<TimelineItem
					icon="fa-cloud"
					date={t("timeline.architect.date")}
					title={t("timeline.architect.title")}
					company={
						<a
							href="https://www.jusmundi.com"
							className="timeline-company"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Image
								alt=""
								aria-hidden="true"
								className="jusmundi-link-icon"
								decoding="async"
								height={16}
								src="/assets/nabla/jusmundi-favicon.ico"
								width={16}
							/>
							{t("timeline.company.jusmundi")}
						</a>
					}
				>
					<p className="timeline-description">
						{t("timeline.architect.desc")}{" "}
						<a className="timeline-company" href={`${prefix}/jm`}>
							{t("timeline.architect.more")}
						</a>
					</p>
					<AchievementTags
						values={[
							t("timeline.architect.ach1"),
							t("timeline.architect.ach2"),
							t("timeline.architect.ach3"),
							t("timeline.architect.ach4"),
						]}
					/>
				</TimelineItem>

				<TimelineItem
					icon="fa-handshake"
					date={t("timeline.engineer.date")}
					title={t("timeline.engineer.title")}
					company={
						<span className="timeline-company">
							{t("timeline.engineer.company")}
						</span>
					}
				>
					<p className="timeline-description">{t("timeline.engineer.desc")}</p>
					<AchievementTags
						values={[
							t("timeline.engineer.ach1"),
							t("timeline.engineer.ach2"),
							t("timeline.engineer.ach3"),
							t("timeline.engineer.ach4"),
							t("timeline.engineer.ach5"),
						]}
					/>
				</TimelineItem>

				<TimelineItem
					icon="fa-code"
					date={t("timeline.senior.date")}
					title={t("timeline.senior.title")}
					company={
						<span className="timeline-company">
							{t("timeline.senior.company")}
						</span>
					}
				>
					<p className="timeline-description">{t("timeline.senior.desc")}</p>
					<AchievementTags
						values={[
							t("timeline.senior.ach1"),
							t("timeline.senior.ach2"),
							t("timeline.senior.ach3"),
							t("timeline.senior.ach4"),
						]}
					/>
				</TimelineItem>

				<TimelineItem
					icon="fa-graduation-cap"
					date={t("timeline.degree.date")}
					title={t("timeline.degree.title")}
					company={
						<span className="timeline-company">
							{t("timeline.degree.company")}
						</span>
					}
				>
					<p className="timeline-description">{t("timeline.degree.desc")}</p>
				</TimelineItem>

				<TimelineItem icon="fa-circle" date="" title="">
					<span aria-hidden="true" />
				</TimelineItem>
			</div>
			<div className="cta-buttons">
				<a className="btn btn-primary" href={`${prefix}/cv`}>
					<i className="fas fa-file" /> {t("timeline.cvcta")}
				</a>
			</div>
			<br />
		</section>
	);
}

function TimelineItem({
	icon,
	date,
	title,
	company,
	children,
}: {
	icon: string;
	date: string;
	title: string;
	company?: React.ReactNode;
	children: React.ReactNode;
}) {
	if (icon === "fa-circle") {
		return (
			<div className="timeline-item">
				<div className="timeline-node">
					<div className="timeline-node-icon" aria-hidden="true">
						<i className={`fas ${icon}`} />
					</div>
					<span className="timeline-node-date" />
				</div>
				<div
					className="timeline-content"
					style={{ display: "none", height: 0, minHeight: 0, padding: 0, margin: 0 }}
				/>
			</div>
		);
	}

	return (
		<div className="timeline-item">
			<div className="timeline-node">
				<div className="timeline-node-icon" aria-hidden="true">
					<i className={`fas ${icon}`} />
				</div>
				<span className="timeline-node-date">{date}</span>
			</div>
			<div className="timeline-content">
				<div className="timeline-header">
					<h3>{title}</h3>
					{company}
				</div>
				{children}
			</div>
		</div>
	);
}

function AchievementTags({ values }: { values: string[] }) {
	return (
		<div className="timeline-achievements">
			{values.map((value) => (
				<span className="achievement-tag" key={value}>
					{value}
				</span>
			))}
		</div>
	);
}
