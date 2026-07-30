/**
 * Shared UI: theme, Font Awesome, Google Translate, smooth scroll, scroll-reveal, coffee FAB,
 * Axeptio, Intercom, print/back-to-top. Configure via attributes on this script tag (or window.NABLA_WIDGETS).
 *
 * Loads synchronously in <head> (no defer) so theme applies before first paint. Main widgets run on DOMContentLoaded
 * when <body> is not yet available during parse.
 *
 * Attributes (all optional):
 *   data-no-font-awesome         — skip loading Font Awesome JS (solid/brands/core)
 *   data-no-google-translate     — skip Google Translate bootstrap
 *   data-no-smooth-scroll      — disable anchor smooth scroll
 *   data-no-scroll-reveal      — disable intersection-observer reveal
 *   data-scroll-reveal         — comma-separated selectors (if set, only these; no default list)
 *   data-reveal-effect         — "opacity" (default) or "animation"
 *   data-reveal-animation      — CSS animation when effect=animation (default: fadeInUp 0.6s ease forwards)
 *   data-axeptio               — load Axeptio (empty attribute is OK)
 *   data-axeptio-client-id     — override default project id
 *   data-axeptio-cookies-version — override cookies version string
 *   data-intercom-app-id       — if set, load Intercom for this app id
 *   data-coffee-fab          — inject floating Ko-fi button (+ modal when Bootstrap JS is present)
 *   data-coffee-kofi-user     — Ko-fi username (default: albandrieu)
 *   data-no-coffee-fab       — skip injection even if #coffee-fab is absent (rare)
 *   data-print-pdf               — inject fixed "Print / Save as PDF" control (calls window.print)
 *   data-print-pdf-lang      — override language for default label ("fr" | "en")
 *   data-print-pdf-label     — custom visible label
 *   data-print-pdf-aria      — optional aria-label (defaults to label text or locale default)
 *   data-no-print-pdf        — do not inject print control
 *   data-no-back-to-top          — do not inject fixed "Back to top" control (injected by default)
 *   data-back-to-top-label   — override visible title (native tooltip); aria uses same unless data-back-to-top-aria is set
 *   data-back-to-top-aria    — override aria-label for the back-to-top control
 *   data-minimal-chrome          — strip main UI: no theme toggle button, Google Translate, print PDF, back-to-top, Axeptio
 *                                  (still applies stored theme to <html> for color consistency). Use on 404, etc.
 *
 * Contact email: if an element with id contact-email exists, a mailto link is injected (homepage).
 *
 * Optional: window.NABLA_WIDGETS = { intercomAppId: "todo" } if the script is injected without currentScript.
 *
 * Place <script src="…/site-widgets.js" …></script> in <head> after CSS; do not use defer on this tag.
 */
/* eslint-env browser */
/* global gtag, google */
(() => {
	var root = document.currentScript;
	var preset = window.NABLA_WIDGETS || {};

	/** Next.js <Script> and other injectors often leave currentScript null; resolve the real tag for data-* config. */
	function widgetsScriptTag() {
		return root || document.querySelector('script[src*="site-widgets.js"]');
	}

	function minimalChrome() {
		return (
			widgetsScriptTag()?.hasAttribute("data-minimal-chrome") ||
			preset.minimalChrome === true ||
			String(preset.minimalChrome || "").toLowerCase() === "true"
		);
	}

	/** Next.js App Router shell (see app/[locale]/layout.tsx); use next-intl instead of Google Translate. */
	function isNextIntlAppShell() {
		return (
			document.documentElement.getAttribute("data-nabla-app") === "next-intl"
		);
	}

	// ----- Theme (aligned with theme-toggle.js) -----
	(() => {
		const THEMES = {
			LIGHT: "light",
			DARK: "dark",
			AUTO: "auto",
		};

		const STORAGE_KEY = "site-theme-preference";
		const ROOT_ID = "theme-toggle-root";

		const MODE_META = [
			{ theme: THEMES.LIGHT, label: "Light", short: "Light", icon: "☀️" },
			{ theme: THEMES.DARK, label: "Dark", short: "Dark", icon: "🌙" },
			{ theme: THEMES.AUTO, label: "Auto (system)", short: "Auto", icon: "🌓" },
		];

		function getSystemPreference() {
			if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
				return THEMES.DARK;
			}
			return THEMES.LIGHT;
		}

		function getStoredTheme() {
			try {
				const stored = localStorage.getItem(STORAGE_KEY);
				return stored && Object.values(THEMES).includes(stored)
					? stored
					: THEMES.AUTO;
			} catch (e) {
				console.warn("Unable to access localStorage:", e);
				return THEMES.AUTO;
			}
		}

		function storeTheme(theme) {
			try {
				localStorage.setItem(STORAGE_KEY, theme);
			} catch (e) {
				console.warn("Unable to store theme preference:", e);
			}
		}

		function updateToggleChrome(preference) {
			const root = document.getElementById(ROOT_ID);
			if (!root) return;

			root.querySelectorAll(".theme-toggle__btn").forEach((btn) => {
				const t = btn.getAttribute("data-theme");
				const on = t === preference;
				btn.setAttribute("aria-pressed", on ? "true" : "false");
				btn.classList.toggle("is-active", on);
			});
		}

		function applyTheme(theme) {
			const effectiveTheme =
				theme === THEMES.AUTO ? getSystemPreference() : theme;

			document.documentElement.setAttribute("data-theme", effectiveTheme);
			updateToggleChrome(theme);

			window.dispatchEvent(
				new CustomEvent("themechange", {
					detail: { theme: effectiveTheme, preference: theme },
				}),
			);
		}

		function getNextTheme(currentTheme) {
			switch (currentTheme) {
				case THEMES.LIGHT:
					return THEMES.DARK;
				case THEMES.DARK:
					return THEMES.AUTO;
				default:
					return THEMES.LIGHT;
			}
		}

		function setTheme(theme) {
			if (!Object.values(THEMES).includes(theme)) return;
			storeTheme(theme);
			applyTheme(theme);
			if (typeof gtag === "function") {
				gtag("event", "theme_toggle", {
					event_category: "UI",
					event_label: theme,
				});
			}
		}

		function toggleTheme() {
			const currentTheme = getStoredTheme();
			const nextTheme = getNextTheme(currentTheme);
			setTheme(nextTheme);
		}

		function createThemeToggle() {
			if (document.getElementById(ROOT_ID)) {
				return;
			}

			const preference = getStoredTheme();

			const root = document.createElement("div");
			root.id = ROOT_ID;
			root.className = "theme-toggle";
			root.setAttribute("role", "region");
			root.setAttribute("aria-label", "Display theme");

			const track = document.createElement("div");
			track.className = "theme-toggle__track";
			track.setAttribute("role", "group");
			track.setAttribute("aria-label", "Color mode");

			for (const { theme, label, short, icon } of MODE_META) {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "theme-toggle__btn";
				btn.dataset.theme = theme;
				btn.setAttribute("aria-label", label);
				btn.setAttribute("title", label);
				const span = document.createElement("span");
				span.className = "theme-toggle__icon";
				span.setAttribute("aria-hidden", "true");
				span.textContent = icon;
				btn.appendChild(span);
				const text = document.createElement("span");
				text.className = "theme-toggle__text";
				text.textContent = short;
				btn.appendChild(text);
				btn.addEventListener("click", () => setTheme(theme));
				track.appendChild(btn);
			}

			root.appendChild(track);
			document.body.appendChild(root);
			updateToggleChrome(preference);
		}

		/**
		 * Listen for system theme changes
		 */
		function watchSystemTheme() {
			if (!window.matchMedia) return;

			const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

			// Modern browsers
			if (darkModeQuery.addEventListener) {
				darkModeQuery.addEventListener("change", () => {
					const storedTheme = getStoredTheme();
					if (storedTheme === THEMES.AUTO) {
						applyTheme(THEMES.AUTO);
					}
				});
			}
			// Older browsers
			else if (darkModeQuery.addListener) {
				darkModeQuery.addListener(() => {
					const storedTheme = getStoredTheme();
					if (storedTheme === THEMES.AUTO) {
						applyTheme(THEMES.AUTO);
					}
				});
			}
		}

		/**
		 * Initialize theme system
		 */
		function initTheme() {
			// Apply theme as early as possible to prevent flash
			const storedTheme = getStoredTheme();
			applyTheme(storedTheme);

			if (minimalChrome()) {
				return;
			}

			// Wait for DOM to be ready before creating button
			if (document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", () => {
					createThemeToggle();
					watchSystemTheme();
				});
			} else {
				createThemeToggle();
				watchSystemTheme();
			}
		}

		// Initialize immediately
		initTheme();

		window.themeToggle = {
			toggle: toggleTheme,
			set: setTheme,
			get: getStoredTheme,
			getEffective: () => {
				const theme = getStoredTheme();
				return theme === THEMES.AUTO ? getSystemPreference() : theme;
			},
		};
	})();

	function siteOriginFromScript() {
		var el = widgetsScriptTag();
		if (!el || !el.src) {
			return "";
		}
		try {
			var u = new URL(el.src, window.location.href);
			var p = u.pathname;
			var i = p.lastIndexOf("/");
			u.pathname = p.slice(0, i + 1);
			u.search = "";
			u.hash = "";
			return u.href;
		} catch (_e) {
			return "";
		}
	}

	function injectFontAwesome() {
		if (widgetsScriptTag()?.hasAttribute("data-no-font-awesome")) return;
		if (preset.noFontAwesome) return;
		var base = siteOriginFromScript();
		if (!base) return;
		var prefix = base.charAt(base.length - 1) === "/" ? base : base + "/";
		var chain = [
			{
				marker: "fontawesome-free-7.1.0-web/js/fontawesome.js",
				path: "assets/fontawesome-free-7.1.0-web/js/fontawesome.js",
				data: { "data-auto-replace-svg": "nest" },
			},
			{
				marker: "fontawesome-free-7.1.0-web/js/solid.js",
				path: "assets/fontawesome-free-7.1.0-web/js/solid.js",
				data: {},
			},
			{
				marker: "fontawesome-free-7.1.0-web/js/brands.js",
				path: "assets/fontawesome-free-7.1.0-web/js/brands.js",
				data: {},
			},
		];
		function loadOne(i) {
			if (i >= chain.length) return;
			var item = chain[i];
			if (document.querySelector('script[src*="' + item.marker + '"]')) {
				loadOne(i + 1);
				return;
			}
			var s = document.createElement("script");
			s.src = prefix + item.path;
			Object.keys(item.data).forEach((k) => {
				s.setAttribute(k, item.data[k]);
			});
			s.onload = () => {
				loadOne(i + 1);
			};
			s.onerror = () => {
				loadOne(i + 1);
			};
			(document.head || document.documentElement).appendChild(s);
		}
		loadOne(0);
	}

	function initGoogleTranslate() {
		if (minimalChrome()) return;
		if (widgetsScriptTag()?.hasAttribute("data-no-google-translate")) return;
		if (isNextIntlAppShell()) return;
		if (preset.noGoogleTranslate) return;
		if (window.__NABLA_GOOGLE_TRANSLATE_STARTED) return;
		window.__NABLA_GOOGLE_TRANSLATE_STARTED = true;

		var INCLUDED_LANGS = "en,fr,no,de";

		var TOGGLE_SVG =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

		function bindMobileToggle(wrap, toggle) {
			function setOpen(open) {
				wrap.classList.toggle("is-open", open);
				toggle.setAttribute("aria-expanded", open ? "true" : "false");
			}
			toggle.addEventListener("click", (e) => {
				e.stopPropagation();
				setOpen(!wrap.classList.contains("is-open"));
			});
			document.addEventListener("click", (e) => {
				var t = e.target;
				if (t instanceof Node && !wrap.contains(t)) setOpen(false);
			});
			document.addEventListener("keydown", (e) => {
				if (e.key === "Escape") setOpen(false);
			});
		}

		function ensureMount() {
			var el = document.getElementById("google_translate_element");
			if (el) {
				var existingWrap = el.closest(".google-translate-widget");
				if (existingWrap?.querySelector(".google-translate-widget__toggle")) {
					return el;
				}
				if (existingWrap) {
					var upToggle = document.createElement("button");
					upToggle.type = "button";
					upToggle.className = "google-translate-widget__toggle";
					upToggle.setAttribute("aria-expanded", "false");
					upToggle.setAttribute("aria-controls", "google_translate_element");
					upToggle.setAttribute("aria-label", "Choose translation language");
					upToggle.innerHTML = TOGGLE_SVG;

					var upPanel = document.createElement("div");
					upPanel.className = "google-translate-widget__panel";

					existingWrap.insertBefore(upToggle, el);
					upPanel.appendChild(el);
					existingWrap.appendChild(upPanel);
					bindMobileToggle(existingWrap, upToggle);
					return el;
				}
				return el;
			}
			var wrap = document.createElement("div");
			wrap.className = "google-translate-widget";
			wrap.setAttribute("aria-label", "Language translation options");

			var toggle = document.createElement("button");
			toggle.type = "button";
			toggle.className = "google-translate-widget__toggle";
			toggle.setAttribute("aria-expanded", "false");
			toggle.setAttribute("aria-controls", "google_translate_element");
			toggle.setAttribute("aria-label", "Choose translation language");
			toggle.innerHTML = TOGGLE_SVG;

			var panel = document.createElement("div");
			panel.className = "google-translate-widget__panel";

			el = document.createElement("div");
			el.id = "google_translate_element";
			panel.appendChild(el);

			wrap.appendChild(toggle);
			wrap.appendChild(panel);
			bindMobileToggle(wrap, toggle);

			var body = document.body;
			if (body) {
				body.insertBefore(wrap, body.firstChild);
				return el;
			}
			return null;
		}

		function loadExternal() {
			if (
				document.querySelector(
					'script[src*="translate.google.com/translate_a/element.js"]',
				)
			)
				return;
			var s = document.createElement("script");
			s.src =
				"https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
			(document.head || document.documentElement).appendChild(s);
		}

		function start() {
			var mount = ensureMount();
			if (!mount) return;
			loadExternal();
		}

		window.googleTranslateElementInit = () => {
			if (minimalChrome()) return;
			if (isNextIntlAppShell()) return;
			if (window.__NABLA_GOOGLE_TRANSLATE_READY) return;
			if (
				!window.google ||
				!google.translate ||
				!google.translate.TranslateElement
			)
				return;
			var mount = document.getElementById("google_translate_element");
			if (!mount) return;
			window.__NABLA_GOOGLE_TRANSLATE_READY = true;
			new google.translate.TranslateElement(
				{
					pageLanguage: "en",
					includedLanguages: INCLUDED_LANGS,
					layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
					autoDisplay: false,
				},
				"google_translate_element",
			);
		};

		if (document.body) {
			start();
		} else {
			document.addEventListener("DOMContentLoaded", start);
		}
	}

	injectFontAwesome();
	initGoogleTranslate();
	function has(name) {
		return !!widgetsScriptTag()?.hasAttribute(name);
	}

	function _attr(name, fallback) {
		var w = widgetsScriptTag();
		if (w?.hasAttribute(name)) {
			var v = w.getAttribute(name);
			return v === "" ? true : v;
		}
		return fallback;
	}

	var DEFAULT_AXEPTIO_CLIENT = "63ff48361876ce66c29dddcd";
	var DEFAULT_AXEPTIO_VER = "nabla-en";
	var DEFAULT_REVEAL_SELECTORS =
		".service-card, .skill-category, .tool-item, .contact-card, .social-card, .js-animate-on-scroll, [data-animate-on-scroll]";

	function initSmoothScroll() {
		/* Delegation: catches footer / late links; one listener vs every anchor */
		document.addEventListener(
			"click",
			(e) => {
				if (e.defaultPrevented) return;
				var anchor = e.target?.closest?.('a[href^="#"]');
				if (!anchor) return;
				var href = anchor.getAttribute("href");
				if (!href || href === "#" || href.length <= 1) return;
				/* #top targets <a name="top">; native hash + scrollingElement alone are unreliable */
				var frag = href.slice(1);
				if (/^top$/i.test(frag)) {
					e.preventDefault();
					scrollToTopOfPage();
					return;
				}
				var target;
				try {
					target = document.querySelector(href);
				} catch (_err) {
					return;
				}
				if (target) {
					e.preventDefault();
					if (target === document.body || target === document.documentElement) {
						scrollToTopOfPage();
					} else {
						target.scrollIntoView({ behavior: "smooth", block: "start" });
					}
				}
			},
			false,
		);
	}

	function initScrollReveal() {
		if (!window.IntersectionObserver) return;
		if (has("data-no-scroll-reveal") || preset.noScrollReveal) return;

		var explicit =
			widgetsScriptTag()?.getAttribute("data-scroll-reveal") ||
			preset.scrollReveal ||
			null;
		var selectors = explicit
			? String(explicit).trim()
			: DEFAULT_REVEAL_SELECTORS;
		if (!selectors) return;

		var effect = String(
			widgetsScriptTag()?.getAttribute("data-reveal-effect") ||
				preset.revealEffect ||
				"opacity",
		).toLowerCase();
		var anim = String(
			widgetsScriptTag()?.getAttribute("data-reveal-animation") ||
				preset.revealAnimation ||
				"fadeInUp 0.6s ease forwards",
		);

		var observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
		var observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				if (effect === "animation") {
					entry.target.style.animation = anim;
				} else {
					entry.target.style.opacity = "1";
					entry.target.style.transform = "translateY(0)";
				}
			});
		}, observerOptions);

		selectors.split(",").forEach((part) => {
			var sel = part.trim();
			if (!sel) return;
			document.querySelectorAll(sel).forEach((el) => {
				if (effect !== "animation") {
					el.style.opacity = "0";
					el.style.transform = "translateY(20px)";
					el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
				}
				observer.observe(el);
			});
		});
	}

	var DEFAULT_KOFI_USER = "albandrieu";

	function sanitizeKofiUser(raw) {
		var s = String(raw || "").trim();
		if (!s) return DEFAULT_KOFI_USER;
		return /^[a-zA-Z0-9_-]+$/.test(s) ? s : DEFAULT_KOFI_USER;
	}

	function kofiUserFromConfig() {
		var fromAttr = widgetsScriptTag()?.getAttribute("data-coffee-kofi-user");
		if (fromAttr != null && String(fromAttr).trim() !== "") {
			return sanitizeKofiUser(fromAttr);
		}
		if (preset.coffeeKofiUser) return sanitizeKofiUser(preset.coffeeKofiUser);
		return DEFAULT_KOFI_USER;
	}

	function coffeeFabModalVariant() {
		if (window.bootstrap && typeof window.bootstrap.Modal === "function")
			return "bs5";
		if (window.jQuery && typeof window.jQuery.fn.modal === "function")
			return "bs4";
		return "none";
	}

	function escapeHtmlAttr(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;");
	}

	function injectCoffeeFabMarkup(kofiUser) {
		var kofiUrl = "https://ko-fi.com/" + encodeURIComponent(kofiUser);
		var safeHref = escapeHtmlAttr(kofiUrl);

		var btn = document.createElement("button");
		btn.type = "button";
		btn.id = "coffee-fab";
		btn.className = "coffee-fab";
		btn.setAttribute("aria-label", "Support this site");
		btn.setAttribute(
			"title",
			"Is this site useful to you? Less than 1% of readers support this site. A small support helps keep these resources free. Thank you. Offer a coffee.",
		);
		btn.innerHTML =
			'<span class="coffee-fab-inner">' +
			'<span class="steam" aria-hidden="true"><span></span><span></span><span></span></span>' +
			'<i class="fa-solid fa-mug-hot" aria-hidden="true"></i>' +
			"</span>";
		document.body.appendChild(btn);

		var variant = coffeeFabModalVariant();
		if (variant === "none") return;

		var bodyCopy =
			'<p class="mb-2"><strong>Is this site useful to you?</strong></p>' +
			'<p class="text-muted small">This site is maintained with free guides and no ads. A small support, even symbolic, helps keep these resources free and the content growing. Thank you.</p>' +
			'<p class="mb-0"><a href="' +
			safeHref +
			'" target="_blank" rel="noopener noreferrer" class="btn btn-primary">' +
			'<i class="fa-solid fa-mug-hot me-1" aria-hidden="true"></i> Offer a coffee</a></p>';

		var html;
		if (variant === "bs5") {
			html =
				'<div class="modal fade" id="coffeeModal" tabindex="-1" aria-labelledby="coffeeModalLabel" aria-hidden="true">' +
				'<div class="modal-dialog modal-dialog-centered">' +
				'<div class="modal-content">' +
				'<div class="modal-header">' +
				'<h2 class="modal-title h5" id="coffeeModalLabel">Support this site</h2>' +
				'<button type="button" class="btn-close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close"></button>' +
				"</div>" +
				'<div class="modal-body">' +
				bodyCopy +
				"</div></div></div></div>";
		} else {
			html =
				'<div class="modal fade" id="coffeeModal" tabindex="-1" role="dialog" aria-labelledby="coffeeModalLabel" aria-hidden="true">' +
				'<div class="modal-dialog modal-dialog-centered" role="document">' +
				'<div class="modal-content">' +
				'<div class="modal-header">' +
				'<h5 class="modal-title" id="coffeeModalLabel">Support this site</h5>' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span></button></div>' +
				'<div class="modal-body">' +
				bodyCopy +
				"</div></div></div></div>";
		}
		var wrap = document.createElement("div");
		wrap.innerHTML = html;
		document.body.appendChild(wrap.firstElementChild);
	}

	function ensureCoffeeFabInjected() {
		if (document.getElementById("coffee-fab")) return;
		if (has("data-no-coffee-fab") || preset.noCoffeeFab) return;
		var want =
			has("data-coffee-fab") ||
			preset.coffeeFab === true ||
			String(preset.coffeeFab || "").toLowerCase() === "true";
		if (!want) return;
		injectCoffeeFabMarkup(kofiUserFromConfig());
	}

	function initCoffeeFab() {
		ensureCoffeeFabInjected();
		var btn = document.getElementById("coffee-fab");
		if (!btn) return;
		var modalEl = document.getElementById("coffeeModal");
		var kofiUser = kofiUserFromConfig();
		var kofiUrl = "https://ko-fi.com/" + encodeURIComponent(kofiUser);
		btn.addEventListener("click", () => {
			if (modalEl && window.bootstrap && window.bootstrap.Modal) {
				new window.bootstrap.Modal(modalEl).show();
			} else if (modalEl && window.jQuery && modalEl.id) {
				window.jQuery(modalEl).modal("show");
			} else {
				window.open(kofiUrl, "_blank", "noopener,noreferrer");
			}
		});
	}

	var PRINT_PDF_BTN_ID = "nabla-print-pdf-btn";
	var PRINT_PDF_SVG =
		'<svg class="print-button__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm3-6v-2H5v2H3v-4c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v4h-2z"/></svg>';

	function printPdfLangCode() {
		var o = widgetsScriptTag()?.getAttribute("data-print-pdf-lang");
		if (o != null && String(o).trim() !== "") {
			return String(o).trim().toLowerCase().slice(0, 2);
		}
		if (preset.printPdfLang)
			return String(preset.printPdfLang).toLowerCase().slice(0, 2);
		var h = (document.documentElement.lang || "en").toLowerCase();
		return h.slice(0, 2) || "en";
	}

	function printPdfLabels() {
		var custom = widgetsScriptTag()?.getAttribute("data-print-pdf-label");
		var customAria = widgetsScriptTag()?.getAttribute("data-print-pdf-aria");
		var ariaTrim =
			customAria != null && String(customAria).trim() !== ""
				? String(customAria).trim()
				: null;
		if (custom != null && String(custom).trim() !== "") {
			var t = String(custom).trim();
			return { text: t, aria: ariaTrim || t };
		}
		if (preset.printPdfLabel) {
			var pt = String(preset.printPdfLabel);
			var pa = preset.printPdfAria
				? String(preset.printPdfAria)
				: ariaTrim || pt;
			return { text: pt, aria: pa };
		}
		if (ariaTrim) {
			if (printPdfLangCode() === "fr") {
				return { text: "Imprimer / Enregistrer en PDF", aria: ariaTrim };
			}
			return { text: "Print / Save as PDF", aria: ariaTrim };
		}
		if (printPdfLangCode() === "fr") {
			return {
				text: "Imprimer / Enregistrer en PDF",
				aria: "Imprimer ou enregistrer en PDF",
			};
		}
		return {
			text: "Print / Save as PDF",
			aria: "Print or save as PDF",
		};
	}

	function ensurePrintPdfButton() {
		if (minimalChrome()) return;
		if (document.getElementById(PRINT_PDF_BTN_ID)) return;
		if (has("data-no-print-pdf") || preset.noPrintPdf) return;
		var want =
			has("data-print-pdf") ||
			preset.printPdf === true ||
			String(preset.printPdf || "").toLowerCase() === "true";
		if (!want) return;

		var labels = printPdfLabels();
		var btn = document.createElement("button");
		btn.type = "button";
		btn.id = PRINT_PDF_BTN_ID;
		btn.className = "print-button";
		btn.setAttribute("aria-label", labels.aria);
		btn.setAttribute("title", labels.text);
		btn.innerHTML = PRINT_PDF_SVG;
		var span = document.createElement("span");
		span.className = "print-button__label";
		span.textContent = labels.text;
		btn.appendChild(span);
		btn.addEventListener("click", () => {
			window.print();
		});
		document.body.appendChild(btn);
	}

	var BACK_TO_TOP_BTN_ID = "nabla-back-to-top";

	function backToTopLabels() {
		var custom = widgetsScriptTag()?.getAttribute("data-back-to-top-label");
		var customAria = widgetsScriptTag()?.getAttribute("data-back-to-top-aria");
		var ariaTrim =
			customAria != null && String(customAria).trim() !== ""
				? String(customAria).trim()
				: null;
		if (custom != null && String(custom).trim() !== "") {
			var t = String(custom).trim();
			return { aria: ariaTrim || t, title: t };
		}
		if (preset.backToTopLabel) {
			var bt = String(preset.backToTopLabel);
			var ba = preset.backToTopAria
				? String(preset.backToTopAria)
				: ariaTrim || bt;
			return { aria: ba, title: bt };
		}
		if (printPdfLangCode() === "fr") {
			return { aria: "Retour en haut de page", title: "Retour en haut" };
		}
		return { aria: "Back to top of page", title: "Back to top" };
	}

	function removeLegacyBackToTopFabs() {
		document
			.querySelectorAll("a.back-to-top, button.back-to-top")
			.forEach((el) => {
				if (el.id !== BACK_TO_TOP_BTN_ID) el.remove();
			});
	}

	function ensureBackToTopFab() {
		if (minimalChrome()) return;
		removeLegacyBackToTopFabs();
		if (document.getElementById(BACK_TO_TOP_BTN_ID)) return;
		if (has("data-no-back-to-top") || preset.noBackToTop) return;

		var labels = backToTopLabels();
		var link = document.createElement("a");
		link.setAttribute("href", "#top");
		link.id = BACK_TO_TOP_BTN_ID;
		link.className = "back-to-top";
		link.setAttribute("aria-label", labels.aria);
		link.title = labels.title;
		link.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';

		link.addEventListener("click", (e) => {
			e.preventDefault();
			window.scrollTo({ top: 0, behavior: "smooth" });
			document.body.scrollTo({ top: 0, behavior: "smooth" });
			// Also target documentElement for cross-browser compatibility
			document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
		});
		document.body.appendChild(link);
	}

	function initAxeptio() {
		if (minimalChrome()) return;
		var wTag = widgetsScriptTag();
		var force =
			(wTag &&
				(has("data-axeptio") || wTag.getAttribute("data-axeptio-client-id"))) ||
			preset.axeptio;
		if (!force) return;
		var clientId = String(
			wTag?.getAttribute("data-axeptio-client-id") ||
				preset.axeptioClientId ||
				DEFAULT_AXEPTIO_CLIENT,
		);
		var ver = String(
			wTag?.getAttribute("data-axeptio-cookies-version") ||
				preset.axeptioCookiesVersion ||
				DEFAULT_AXEPTIO_VER,
		);
		window.axeptioSettings = { clientId: clientId, cookiesVersion: ver };
		var d = document;
		var s = "script";
		var t = d.getElementsByTagName(s)[0];
		var e = d.createElement(s);
		e.async = true;
		e.src = "//static.axept.io/sdk.js";
		t.parentNode.insertBefore(e, t);
	}

	function initContactEmailLink() {
		var container = document.getElementById("contact-email");
		if (!container) return;
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		var user = "alban" + "." + "andrieu";
		var domain = "albandrieu" + "." + "com";
		var email = user + "@" + domain;
		var link = document.createElement("a");
		link.href = "mailto:" + email;
		link.className = "contact-me-card__link";
		link.textContent = email;
		container.appendChild(link);
	}

	function initIntercom(appId) {
		if (!appId) return;
		window.intercomSettings = {
			api_base: "https://api-iam.intercom.io",
			app_id: appId,
		};
		var w = window;
		var ic = w.Intercom;
		if (typeof ic === "function") {
			ic("reattach_activator");
			ic("update", w.intercomSettings);
			return;
		}
		var d = document;
		var i = () => {
			i.c(arguments);
		};
		i.q = [];
		i.c = (args) => {
			i.q.push(args);
		};
		w.Intercom = i;
		var widgetUrl =
			"https://widget.intercom.io/widget/" + encodeURIComponent(appId);
		var l = () => {
			var s = d.createElement("script");
			s.type = "text/javascript";
			s.async = true;
			s.src = widgetUrl;
			var x = d.getElementsByTagName("script")[0];
			x.parentNode.insertBefore(s, x);
		};
		if (document.readyState === "complete") {
			l();
		} else if (w.attachEvent) {
			w.attachEvent("onload", l);
		} else {
			w.addEventListener("load", l, false);
		}
	}

	/** Footer: set `© {year} {COPYRIGHT_ATTRIBUTION}.` on `.footer-copyright`. Optional `data-copyright-tail` appends after the period (e.g. ctid page). */
	function initSiteCopyright() {
		var COPYRIGHT_ATTRIBUTION =
			"Alban Andrieu. Independent DevSecOps Professional";
		var y = String(new Date().getFullYear());
		document.querySelectorAll(".footer-copyright").forEach((el) => {
			var tail = el.getAttribute("data-copyright-tail");
			var line = "© " + y + " " + COPYRIGHT_ATTRIBUTION + ".";
			if (tail) {
				line += " " + tail.trim();
			}
			el.textContent = line;
		});
	}

	function initMainWidgets() {
		if (!has("data-no-smooth-scroll") && !preset.noSmoothScroll) {
			initSmoothScroll();
		}

		initScrollReveal();
		initCoffeeFab();
		ensurePrintPdfButton();
		ensureBackToTopFab();
		initSiteCopyright();
		initContactEmailLink();
		initAxeptio();

		var intercomId =
			widgetsScriptTag()?.getAttribute("data-intercom-app-id") ||
			preset.intercomAppId ||
			preset.intercomAppID;
		if (intercomId) {
			initIntercom(String(intercomId));
		}
	}

	if (document.body) {
		initMainWidgets();
	} else {
		document.addEventListener("DOMContentLoaded", initMainWidgets);
	}
})();
