import React from "react";

export default function FreenasHeroSection() {
	return (
		<section className="freenas-hero" aria-label="FreeNAS branding/intro">
			<div className="container py-4 mb-2">
				<h1 className="display-4 mb-2 text-center">FreeNAS Infrastructure</h1>
				<p className="lead mb-1 text-center">
					Self-hosted applications and services running on FreeNAS (archived).
				</p>
				<p className="lead text-center small text-muted">
					Legacy homelab, plugins & automation
				</p>
			</div>
		</section>
	);
}
