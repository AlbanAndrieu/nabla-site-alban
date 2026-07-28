import React from "react";

export default function HeroSection() {
	return (
		<section className="truenas-hero" aria-label="TrueNAS branding/intro">
			<div className="container py-4 mb-2">
				<h1 className="display-4 mb-2 text-center">
					TrueNAS Scale Homelab & Hardware
				</h1>
				<p className="lead mb-1 text-center">
					TrueNAS Scale homelab: hardware platform, self-hosted apps (Portainer,
					Grafana, n8n, Home Assistant), security tooling, and AI-related
					services.
				</p>
				<p className="lead text-center small text-muted">
					Guide & documentation Alban Andrieu. <br />
					Hardware, apps, ZFS, automation & AI, open-source ethos, full-stack
					hands-on
				</p>
			</div>
		</section>
	);
}
