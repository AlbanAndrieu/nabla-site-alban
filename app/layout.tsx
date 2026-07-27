import "./globals.css";
import Script from "next/script";

export const metadata = {
	title: "Nabla Site Alban",
	description: "Jusmundi Case Studies and Reviews (2022–2025)",
};

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params?: Promise<{ locale?: string }>;
}) {
	const resolvedParams = await params;
	const locale = resolvedParams?.locale === "fr" ? "fr" : "en";
	return (
		<html lang={locale} data-nabla-app="next-intl" suppressHydrationWarning>
			<head>
				<meta
					name="description"
					content="Freelance DevSecOps engineer and cloud architect with 20+ years of experience. I help startups and enterprises secure, automate and scale AWS, Azure and OVH platforms, with a focus on AI workloads, security and compliance (ISO 27001 / SOC 2)."
				/>
				<meta
					name="keywords"
					content="freelance DevSecOps engineer, freelance cloud architect, AWS, Azure, OVH, DevSecOps consultant, cloud security consultant, DevSecOps for AI startups, Alban Andrieu"
				/>
				<meta name="author" content="Alban Andrieu" />
				<meta
					name="image"
					content="https://albanandrieu.com/assets/nabla/nabla-4.svg"
				/>
				<meta property="og:type" content="profile" />
				<meta property="og:url" content="https://albanandrieu.com/" />
				<meta
					property="og:title"
					content="Alban Andrieu — Freelance DevSecOps & Cloud Architect"
				/>
				<meta
					property="og:description"
					content="Freelance DevSecOps and cloud architect. Secure, automate and scale AWS, Azure and OVH platforms for AI-driven and security-critical products."
				/>
				<meta
					property="og:image"
					content="https://albanandrieu.com/assets/nabla/nabla-4.svg"
				/>
				<meta property="og:site_name" content="Alban Andrieu's C.V" />
				<meta property="twitter:card" content="summary" />
				<meta property="twitter:domain" content="albanandrieu.com" />
				<meta
					property="twitter:title"
					content="Alban Andrieu — Freelance DevSecOps & Cloud Architect"
				/>
				<meta
					property="twitter:description"
					content="Freelance cloud security consultant and DevSecOps engineer. AWS, Azure, OVH — AI infra, compliance, CI/CD and IaC."
				/>
				<meta
					property="twitter:image"
					content="https://albanandrieu.com/assets/nabla/nabla-4.svg"
				/>
				<meta property="twitter:url" content="https://albanandrieu.com" />
				<meta name="twitter:label1" content="Cloud architect" />
				<meta name="twitter:data1" content="AI architect" />
				<meta name="twitter:label2" content="DevSecOps" />
				<meta name="referrer" content="always" />
				<meta name="color-scheme" content="light dark" />
				<link rel="stylesheet" href="/landing-sections.css" />
				<link rel="stylesheet" href="/wireframe.css" />
				<link rel="stylesheet" href="/theme.css" />
				<link rel="stylesheet" href="/style.css" />
				<link rel="stylesheet" href="/timeline.css" />
				<link rel="stylesheet" href="/education.css" />
				<link rel="stylesheet" href="/print.css" />
				<link rel="stylesheet" href="/site-content-page.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/fontawesome.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/brands.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/solid.css" />
				<link rel="stylesheet" href="/jm/jusmundi.css" />
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
			</head>
			<body>
				{children}
				{/* Next.js way to load scripts post-hydration */}
				<Script src="/site-widgets.js" strategy="afterInteractive" />
				<Script
					src="/site-analytics.js"
					data-analytics-mode="home"
					data-ahrefs-key="tg3zLMS/bebJFl0LxctiCw"
					strategy="afterInteractive"
				/>
			</body>
		</html>
	);
}
