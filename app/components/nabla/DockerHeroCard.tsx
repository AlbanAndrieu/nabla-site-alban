import React from "react";
import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import styles from "./NablaHeroCard.module.css";

type Props = {
	title: string;
	description: string;
	linkLabel: string;
	linkUrl: string;
};

export default function DockerHeroCard({
	title,
	description,
	linkLabel,
	linkUrl,
}: Props) {
	return (
		<div className={styles.wrapper}>
			<Card
				borderless
				className={styles.card}
				data-nabla-hero-card="docker"
				elevated
			>
				<div className={styles.header}>
					<span className={`${styles.brandIcon} ${styles.dockerIcon}`}>
						<i className="fab fa-docker" aria-hidden="true"></i>
					</span>
					<Badge className={styles.inlineBadge} variant="info">
						open source
					</Badge>
				</div>
				<CardBody className={styles.body}>
					<h3 className={styles.title}>{title}</h3>
					<p className={styles.description}>{description}</p>
					<ActionLink
						href={linkUrl}
						target="_blank"
						rel="noopener noreferrer"
						variant="outlineInfo"
					>
						<i className="fab fa-docker" aria-hidden="true"></i>
						{linkLabel}
					</ActionLink>
				</CardBody>
			</Card>
		</div>
	);
}
