import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
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
			"api/**",
			"index/**",
			"vendor/**",
		],
	},
	{
		...js.configs.recommended,
		// Core JavaScript rules such as no-undef/no-unused-vars do not understand
		// TypeScript type space. Next's TypeScript-aware config remains active below.
		files: ["**/*.{js,cjs,mjs}"],
	},
	...nextVitals,
	{
		files: ["scripts/**/*.{cjs,mjs}", "*.config.{cjs,js,mjs}", "server.cjs"],
		languageOptions: {
			globals: {
				__dirname: "readonly",
				AbortSignal: "readonly",
				console: "readonly",
				fetch: "readonly",
				module: "readonly",
				process: "readonly",
				require: "readonly",
				URL: "readonly",
			},
		},
	},
];
