import path from "node:path";

function escapeData(value) {
	return String(value)
		.replaceAll("%", "%25")
		.replaceAll("\r", "%0D")
		.replaceAll("\n", "%0A");
}

function escapeProperty(value) {
	return escapeData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

function relativeFile(filePath) {
	const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
	const relative = path.relative(workspace, filePath) || path.basename(filePath);
	return relative.split(path.sep).join("/");
}

function annotationFor(filePath, message) {
	const level = message.severity === 2 ? "error" : "warning";
	const line = message.line || 1;
	const column = message.column || 1;
	const endLine = message.endLine || line;
	const endColumn = message.endColumn || column;
	const title = message.ruleId ? `ESLint ${message.ruleId}` : "ESLint";

	return `::${level} file=${escapeProperty(relativeFile(filePath))},line=${line},col=${column},endLine=${endLine},endColumn=${endColumn},title=${escapeProperty(title)}::${escapeData(message.message)}`;
}

function localLine(filePath, message) {
	const level = message.severity === 2 ? "error" : "warning";
	const rule = message.ruleId ? `  ${message.ruleId}` : "";
	return `${relativeFile(filePath)}:${message.line || 1}:${message.column || 1}  ${level}  ${message.message}${rule}`;
}

export default function githubActionsFormatter(results) {
	const messages = [];

	for (const result of results) {
		for (const message of result.messages) {
			messages.push(
				process.env.GITHUB_ACTIONS === "true"
					? annotationFor(result.filePath, message)
					: localLine(result.filePath, message),
			);
		}
	}

	return messages.length > 0 ? `${messages.join("\n")}\n` : "";
}
