module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./public/*.html",
  ],
  css: ["./public/*.css"],
  safelist: [
    // Add classes here that should never be removed by PurgeCSS (e.g., from dynamic/className strings)
  ],
};
