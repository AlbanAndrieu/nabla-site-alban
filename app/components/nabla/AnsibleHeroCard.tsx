import React from "react";

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
			<div
				className="card shadow border-0"
				style={{ maxWidth: 400, minWidth: 320 }}
			>
				<div className="text-center pt-4 pb-2">
					{imageSrc ? (
						<img
							src={imageSrc}
							alt={imageAlt || "Ansible logo"}
							width={64}
							height={64}
							className="mb-2 mx-auto d-block"
							style={{ maxHeight: 70 }}
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
						<span className="badge bg-success mt-2" style={{ fontSize: 16 }}>
							open source
						</span>
					</div>
				</div>
				<div className="card-body text-center">
					<h3 className="h5">{title}</h3>
					<p className="card-text text-muted mb-3">{description}</p>
					<a
						href={linkUrl}
						className="btn btn-outline-primary"
						target="_blank"
						rel="noopener noreferrer"
					>
						<i className="fab fa-github me-2"></i>
						{linkLabel}
					</a>
				</div>
			</div>
		</div>
	);
}
