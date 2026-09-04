export type ResourceLinkIcon = "external" | "github" | "brain" | "terminal";

export type ResourceLink =
	| {
			href: string;
			icon?: ResourceLinkIcon;
	  }
	| {
			page: "ai";
			hash: string;
			icon: ResourceLinkIcon;
	  };

export type SecuritySectionKey =
	| "owasp"
	| "personal"
	| "network"
	| "hardening"
	| "ssh"
	| "openclaw"
	| "compliance"
	| "vulnerability"
	| "ciScanning"
	| "pentest"
	| "siem"
	| "devsecops"
	| "authentication"
	| "infrastructure"
	| "cloud"
	| "learning";

export type ResourceSectionDefinition = {
	key: SecuritySectionKey;
	id: string;
	iconClass: string;
	links: readonly ResourceLink[];
};

export const RESOURCE_SECTIONS: readonly ResourceSectionDefinition[] = [
	{
		key: "owasp",
		id: "owasp-resources",
		iconClass: "fa-solid fa-shield-halved",
		links: [
			{ href: "https://owasp.org/www-project-top-ten/" },
			{ href: "https://owasp.org/www-project-web-security-testing-guide/" },
			{
				href: "https://owasp.org/www-project-application-security-verification-standard/",
			},
			{ href: "https://owasp.org/www-community/vulnerabilities/" },
			{ href: "https://owasp.org/www-project-api-security/" },
			{ href: "https://owasp.org/www-project-mobile-top-10/" },
			{ href: "https://cheatsheetseries.owasp.org/" },
			{
				href: "https://pentest-testing-corp.medium.com/fix-security-misconfiguration-in-symfony-apps-be6ace002709",
			},
		],
	},
	{
		key: "personal",
		id: "personal-security-checklist",
		iconClass: "fa-solid fa-user-shield",
		links: [
			{
				href: "https://github.com/lissy93/personal-security-checklist",
				icon: "github",
			},
			{ href: "https://digital-defense.io/" },
			{ href: "https://www.privacytools.io/" },
		],
	},
	{
		key: "network",
		id: "network-security-scanning",
		iconClass: "fa-solid fa-network-wired",
		links: [
			{
				href: "https://www.it-connect.fr/tuto-scanopy-outil-creation-automatique-diagramme-reseau/",
			},
			{ href: "https://nmap.org/" },
			{ href: "https://www.wireshark.org/" },
			{
				href: "https://github.com/robertdavidgraham/masscan",
				icon: "github",
			},
			{ href: "https://www.openvas.org/" },
		],
	},
	{
		key: "hardening",
		id: "system-hardening-cis",
		iconClass: "fa-solid fa-server",
		links: [
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/cis-benchmarks/",
			},
			{ href: "https://www.cisecurity.org/cis-benchmarks/" },
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/",
			},
			{ href: "https://dev-sec.io/" },
			{ href: "https://www.open-scap.org/" },
			{ href: "https://cisofy.com/lynis/" },
			{
				href: "https://github.com/dev-sec/ansible-collection-hardening",
				icon: "github",
			},
			{
				href: "https://medium.com/@anshumaansingh10jan/comprehensive-vm-hardening-guide-using-openscap-and-ansible-88bd93186ddd",
			},
			{
				href: "https://medium.com/aardvark-infinity/program-title-automated-system-hardening-and-security-audit-script-1e00eb5a577c",
			},
		],
	},
	{
		key: "ssh",
		id: "ssh-security-hardening",
		iconClass: "fa-solid fa-terminal",
		links: [
			{
				href: "https://blog.stephane-robert.info/docs/securiser/durcissement/ssh/",
			},
			{ href: "https://www.ssh.com/academy/ssh/security" },
			{ href: "https://github.com/mozilla/ssh_scan", icon: "github" },
			{ href: "https://github.com/jtesta/ssh-audit", icon: "github" },
			{ href: "https://infosec.mozilla.org/guidelines/openssh" },
			{ page: "ai", hash: "nvidia-openshell", icon: "brain" },
			{ page: "ai", hash: "open-terminal", icon: "terminal" },
		],
	},
	{
		key: "openclaw",
		id: "openclaw-security",
		iconClass: "fa-solid fa-robot",
		links: [
			{ href: "https://aimaker.substack.com/p/openclaw-security-hardening-guide" },
			{
				href: "https://github.com/Next-Kick/openclaw-hardened-ansible",
				icon: "github",
			},
			{
				href: "https://nextkicklabs.substack.com/p/openclaw-hardened-deployment-security-with-ansible",
			},
		],
	},
	{
		key: "compliance",
		id: "security-standards-compliance",
		iconClass: "fa-solid fa-file-certificate",
		links: [
			{ href: "https://www.nist.gov/cyberframework" },
			{ href: "https://www.iso.org/isoiec-27001-information-security.html" },
			{ href: "https://www.iso.org/standard/42001" },
			{ href: "https://www.pcisecuritystandards.org/" },
			{ href: "https://gdpr.eu/" },
			{ href: "https://drata.com/" },
			{ href: "https://www.vanta.com/" },
		],
	},
	{
		key: "vulnerability",
		id: "vulnerability-management",
		iconClass: "fa-solid fa-bug",
		links: [
			{ href: "https://nvd.nist.gov/" },
			{ href: "https://cve.mitre.org/" },
			{ href: "https://app.opencve.io/org/Nabla-org/projects/" },
			{ href: "https://www.cisa.gov/known-exploited-vulnerabilities" },
			{ href: "https://github.com/aquasecurity/trivy", icon: "github" },
			{ href: "https://github.com/zaproxy/zaproxy", icon: "github" },
			{ href: "https://github.com/OSTEsayed/OSTE-Meta-Scan", icon: "github" },
			{ href: "https://korben.info/theauditor-outil-securite-sast-ia.html" },
		],
	},
	{
		key: "ciScanning",
		id: "vulnerability-scanning-dast-sast",
		iconClass: "fa-solid fa-search",
		links: [
			{
				href: "https://blog.stephane-robert.info/docs/pipeline-cicd/gitlab/outils/plumber/",
			},
			{ href: "https://dashboard.infracost.io/org/albanandrieu/dashboard" },
		],
	},
	{
		key: "pentest",
		id: "pentest-tools",
		iconClass: "fa-solid fa-crosshairs",
		links: [{ href: "https://app.pentest-tools.com/" }],
	},
	{
		key: "siem",
		id: "siem-malware-detection",
		iconClass: "fa-solid fa-shield-virus",
		links: [
			{
				href: "https://documentation.wazuh.com/current/user-manual/capabilities/malware-detection/clam-av-logs-collection.html",
			},
		],
	},
	{
		key: "devsecops",
		id: "devsecops-tools",
		iconClass: "fa-solid fa-code",
		links: [
			{
				href: "https://fluxcd.io/flux/guides/mozilla-sops/#encrypting-secrets-using-hashicorp-vault",
			},
			{
				href: "https://medium.com/@connect.hashblock/fastapi-security-without-slowness-b9893008216e",
			},
			{ href: "https://github.com/oxsecurity/megalinter", icon: "github" },
			{ href: "https://github.com/aquasecurity/trivy", icon: "github" },
			{ href: "https://github.com/zricethezav/gitleaks", icon: "github" },
			{ href: "https://pre-commit.com/" },
			{ href: "https://github.com/PyCQA/bandit", icon: "github" },
			{
				href: "https://github.com/antonbabenko/pre-commit-terraform",
				icon: "github",
			},
			{ href: "https://github.com/bridgecrewio/checkov", icon: "github" },
			{ href: "https://github.com/Checkmarx/kics", icon: "github" },
			{ href: "https://github.com/hadolint/hadolint", icon: "github" },
			{ href: "https://github.com/cncf/tag-security", icon: "github" },
			{ href: "https://github.com/github/codeql", icon: "github" },
			{ href: "https://semgrep.dev/" },
			{
				href: "https://github.com/trufflesecurity/trufflehog",
				icon: "github",
			},
			{ href: "https://www.gitguardian.com/lp/secrets-scanning" },
		],
	},
	{
		key: "authentication",
		id: "authentication-jwt",
		iconClass: "fa-solid fa-key",
		links: [
			{
				href: "https://python.plainenglish.io/%EF%B8%8F-fastapi-async-sqlalchemy-2-0-jwt-postgresql-your-modern-boilerplate-setup-76429dcb93da",
			},
		],
	},
	{
		key: "infrastructure",
		id: "app-infrastructure-security",
		iconClass: "fa-solid fa-server",
		links: [
			{ href: "https://apps.truenas.com/getting-started/securing-apps/" },
		],
	},
	{
		key: "cloud",
		id: "cloud-security-resources",
		iconClass: "fa-solid fa-cloud",
		links: [
			{
				href: "https://www.cloudflare.com/learning/security/what-is-cloud-security/",
			},
			{ href: "https://github.com/toniblyx/prowler", icon: "github" },
			{ href: "https://cloud.google.com/security/best-practices" },
			{ href: "https://docs.microsoft.com/en-us/azure/security/" },
		],
	},
	{
		key: "learning",
		id: "security-learning-resources",
		iconClass: "fa-solid fa-graduation-cap",
		links: [
			{ href: "https://tryhackme.com/" },
			{ href: "https://www.hackthebox.com/" },
			{ href: "https://portswigger.net/web-security" },
			{ href: "https://www.offensive-security.com/" },
		],
	},
];
