import js from "@eslint/js";
export default [
	{
		ignores: [
			"node_modules/**",
			".venv/**",
			".next/**",
			"out/**",
			"build/**",
			"dist/**",
			"coverage/**",
			"playwright-report/**",
			"test-results/**",
			"*.tsbuildinfo",
			".turbo/**",
			".vercel/**",
			".cache/**",
			".pnpm/**",
			// Static browser assets include vendored and generated JavaScript.
			"public/**/*.js",
			"public/.wrangler/**",
			"api/**",
			"index/**",
			"vendor/**",
		],
	},
	js.configs.recommended,
	{
		files: ["scripts/**/*.mjs", "server.cjs"],
		languageOptions: {
			globals: {
				__dirname: "readonly",
				console: "readonly",
				fetch: "readonly",
				process: "readonly",
			},
		},
	},
];
