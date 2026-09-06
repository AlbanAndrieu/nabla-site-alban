const THEME_BOOTSTRAP = String.raw`(() => {
	const storageKey = "site-theme-preference";
	const valid = new Set(["light", "dark", "auto"]);
	let preference = "auto";
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored && valid.has(stored)) preference = stored;
	} catch {
		// Storage can be unavailable in privacy-restricted contexts; system theme remains safe.
	}
	const systemDark =
		typeof matchMedia === "function" &&
		matchMedia("(prefers-color-scheme: dark)").matches;
	const effective =
		preference === "auto" ? (systemDark ? "dark" : "light") : preference;
	document.documentElement.dataset.theme = effective;
})();`;

export default function ThemeBootstrap() {
	return (
		<script
			id="site-theme-bootstrap"
			dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
		/>
	);
}
