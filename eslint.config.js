import js from "@eslint/js";
export default [
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			"build/**",
			"dist/**",
			"*.tsbuildinfo",
			".turbo/**",
			".vercel/**",
			".cache/**",
			".pnpm/**",
			"public/**/*.min.js",
			"public/d3.v3.min.js",
			"public/index.js",
			"public/arf.js",
			"public/theme-toggle.js",
			"api/**",
			"index/**",
		],
	},
	js.configs.recommended,
];
