import Image from "next/image";
import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import styles from "./NablaHeroCard.module.css";

type Props = {
	title: string;
	description: string;
	linkLabel: string;
	linkUrl: string;
	imageSrc?: string;
	imageAlt?: string;
};

export default function AnsibleHeroCard({
	title,
	description,
	linkLabel,
	linkUrl,
	imageSrc,
	imageAlt,
}: Props) {
	return (
		<div className={styles.wrapper}>
			<Card
				borderless
				className={styles.card}
				data-nabla-hero-card="ansible"
				elevated
			>
				<div className={styles.header}>
					{imageSrc ? (
						<Image
							src={imageSrc}
							alt={imageAlt || "Ansible logo"}
							width={64}
							height={64}
							className={styles.ansibleImage}
						/>
					) : (
						<span className={`${styles.brandIcon} ${styles.ansibleFallback}`}>
							<i className="fab fa-ansible" aria-hidden="true"></i>
						</span>
					)}
					<div className={styles.badgeRow}>
						<Badge className={styles.stackedBadge} variant="success">
							open source
						</Badge>
					</div>
				</div>
				<CardBody className={styles.body}>
					<h3 className={styles.title}>{title}</h3>
					<p className={styles.description}>{description}</p>
					<ActionLink
						href={linkUrl}
						target="_blank"
						rel="noopener noreferrer"
						variant="outline"
					>
						<i className="fab fa-github" aria-hidden="true"></i>
						{linkLabel}
					</ActionLink>
				</CardBody>
			</Card>
		</div>
	);
}
