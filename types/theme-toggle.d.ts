type SiteThemePreference = "auto" | "light" | "dark";

interface Window {
	themeToggle?: {
		get(): SiteThemePreference;
		set(theme: SiteThemePreference): void;
	};
}
