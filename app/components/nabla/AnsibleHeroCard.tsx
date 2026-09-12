import Image from "next/image";
import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";

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
		<div className="d-flex justify-content-center align-items-center mb-5">
			<Card borderless elevated style={{ maxWidth: 400, minWidth: 320 }}>
				<div className="text-center pt-4 pb-2">
					{imageSrc ? (
						<Image
							src={imageSrc}
							alt={imageAlt || "Ansible logo"}
							width={64}
							height={64}
							className="mb-2 mx-auto d-block"
							style={{ maxHeight: 70, height: "auto" }}
						/>
					) : (
						<span
							style={{
								fontSize: 60,
								color: "#e25528",
								display: "inline-block",
							}}
						>
							<i className="fab fa-ansible" aria-hidden="true"></i>
						</span>
					)}
					<div className="w-100">
						<Badge className="mt-2" variant="success">
							open source
						</Badge>
					</div>
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
						<i className="fab fa-github me-2"></i>
						{linkLabel}
					</ActionLink>
				</CardBody>
			</Card>
		</div>
	);
}
