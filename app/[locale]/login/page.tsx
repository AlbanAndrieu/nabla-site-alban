"use client";
import Image from "next/image";
import Script from "next/script";
import { useState } from "react";
import TopAnchor from "@/components/TopAnchor";

export default function LoginPage() {
	const [fetchResult, setFetchResult] = useState<string | null>(null);
	const handleFetch = async () => {
		setFetchResult("Loading...");
		try {
			const resp = await fetch("/v1/nabla-api");
			if (resp.ok) {
				const data = await resp.json();
				setFetchResult(JSON.stringify(data));
			} else {
				setFetchResult("Error fetching data");
			}
		} catch (err) {
			setFetchResult("Network error");
		}
	};
	return (
		<div className="site-content-page page-login page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				Skip to main content
			</a>
			<div className="">
				<div className="container">
					<div className="row">
						<a href="https://hostedscan.com">
							<img
								src="https://hostedscan.com/hostedscan-badge-light.svg"
								alt="HostedScan | An automated vulnerability scanner"
								height={81}
								width={284}
							/>
						</a>
					</div>
					<div className="row">
						<main id="main-content" className="form-signin">
							<form method="POST" action="/handler" autoComplete="off">
								<h2 className="h3 mb-3 fw-normal">Turnstile – Login</h2>
								<div className="form-floating">
									<input type="text" id="user" className="form-control" />
									<label htmlFor="user">User name</label>
								</div>
								<div className="form-floating">
									<input
										type="password"
										id="pass"
										className="form-control"
										autoComplete="off"
										readOnly
										value="CorrectHorseBatteryStaple"
									/>
									<label htmlFor="pass">Password (dummy)</label>
								</div>
								<div className="checkbox mb-3">
									{/* The following line configures the Turnstile widget. */}
									<div
										className="cf-turnstile"
										data-sitekey="0x4AAAAAAABU6iWSRkSavdni"
										data-callback="javascriptCallback"
										data-theme="light"
									></div>
									{/* end. */}
								</div>
								<button className="w-100 btn btn-lg btn-primary" type="submit">
									Sign in
								</button>
							</form>
						</main>
					</div>
					<div className="row">
						<main className="pre-clearance-demo">
							<h2>Pre-clearance Demo</h2>
							<button id="fetchBtn" onClick={handleFetch}>
								Fetch Data
							</button>
							<div id="response" className="mt-2">
								{fetchResult}
							</div>
						</main>
					</div>
				</div>
			</div>
			{/* Uptime Status/Announcement widget script */}
			<Script
				src="https://uptime.betterstack.com/widgets/announcement.js"
				data-id="150620"
				async
				strategy="afterInteractive"
			/>
			{/* Cloudflare Turnstile widget loader */}
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js"
				async
				defer
				strategy="afterInteractive"
			/>
			{/* Site widgets */}
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-scroll-reveal=".service-card,.skill-category,.tool-item"
				data-reveal-effect="animation"
				data-reveal-animation="fadeInUp 0.6s ease forwards"
				data-coffee-fab=""
			/>
		</div>
	);
}
