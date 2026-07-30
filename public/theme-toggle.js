/**
 * Theme Toggle — light / dark / auto (Bootstrap-style segmented control)
 * @file Browser-side script for theme management
 */

/* eslint-env browser */
/* global gtag */

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

  function watchSystemTheme() {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      const storedTheme = getStoredTheme();
      if (storedTheme === THEMES.AUTO) {
        applyTheme(THEMES.AUTO);
      }
    };

    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener("change", onChange);
    } else if (darkModeQuery.addListener) {
      darkModeQuery.addListener(onChange);
    }
  }

  function initTheme() {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);

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
