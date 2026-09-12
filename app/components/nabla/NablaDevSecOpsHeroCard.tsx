import React from "react";
import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";

type Props = {
	title: string;
	description: string;
	linkLabel: string;
	linkUrl: string;
};

export default function NablaDevSecOpsHeroCard({
	title,
	description,
	linkLabel,
	linkUrl,
}: Props) {
	return (
		<div className="d-flex justify-content-center align-items-center mb-5">
			<Card borderless elevated style={{ maxWidth: 400, minWidth: 320 }}>
				<div className="text-center pt-4 pb-2">
					<span style={{ fontSize: 48, color: "#5145cd" }}>
						<i className="fas fa-code" aria-hidden="true"></i>
					</span>
					<Badge className="ms-2">DevSecOps</Badge>
				</div>
				<CardBody className="text-center">
					<h3 className="h5">{title}</h3>
					<p className="card-text text-muted mb-3">{description}</p>
					<ActionLink
						href={linkUrl}
						target="_blank"
						rel="noopener noreferrer"
						variant="outline"
					>
						<i className="fas fa-arrow-up me-2"></i>
						{linkLabel}
					</ActionLink>
				</CardBody>
			</Card>
		</div>
	);
}
