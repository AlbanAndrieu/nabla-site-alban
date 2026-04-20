import config from "@commitlint/config-conventional";
import type { ParserPreset, UserConfig } from "@commitlint/types";
import createPreset from "conventional-changelog-conventionalcommits";
import { merge } from "lodash-es";

// A helper function to create the custom emoji parser preset.
async function createEmojiParser(): Promise<ParserPreset> {
	// Generates the regex from the emojis defined in the conventional config.
	const emojiRegexPart = Object.values(config.prompt.questions.type.enum)
		.map((value) => value.emoji.trim())
		.join("|");

	const parserOpts = {
		// This regular expression validates commit headers with an emoji.
		breakingHeaderPattern: new RegExp(
			`^(?:${emojiRegexPart})\\s+(\\w*)(?:\\((.*)\\))?!:\\s+(.*)$`,
		),
		headerPattern: new RegExp(
			`^(?:${emojiRegexPart})\\s+(\\w*)(?:\\((.*)\\))?!?:\\s+(.*)$`,
		),
	};

	const emojiParser = merge({}, await createPreset(), {
		conventionalChangelog: { parserOpts },
		parserOpts,
		recommendedBumpOpts: { parserOpts },
	});

	return emojiParser;
}

const emojiParser = await createEmojiParser();

export default {
	extends: ["@commitlint/config-conventional"],
	parserPreset: {
		emojiParser,
		parserOpts: {
			// these are samples, add possible prefixes based on your project requirement
			issuePrefixes: ["ANDR-", "TEST-", "DSC-", "ABC-", "CO-"],
		},
	},
	rules: {
		"body-leading-blank": [1, "always"],
		"footer-leading-blank": [1, "always"],
		"header-max-length": [2, "always", 72],
		"scope-case": [2, "always", "lower-case"],
		"subject-case": [
			2,
			"never",
			["sentence-case", "start-case", "pascal-case", "upper-case"],
		],
		"subject-empty": [2, "never"],
		"subject-full-stop": [2, "never", "."],
		"type-case": [2, "always", "lower-case"],
		"type-empty": [2, "never"],
		"type-enum": [
			2,
			"always",
			[
				"build",
				"chore",
				"ci",
				"docs",
				"feat",
				"feature",
				"fix",
				"perf",
				"refactor",
				"revert",
				"style",
				"test",
			],
		],
	},
	prompt: {
		questions: {
			type: {
				enum: {
					// Customize emojis and add the extra space for better alignment.
					build: { emoji: "🛠️ " },
					chore: { emoji: "♻️ " },
					ci: { emoji: "⚙️ " },
					revert: { emoji: "🗑️ " },
				},
				// This setting includes the emoji in the final commit header.
				headerWithEmoji: true,
			},
		},
	},
} satisfies UserConfig;
