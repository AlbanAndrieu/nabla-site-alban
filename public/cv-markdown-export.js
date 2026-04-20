/**
 * CV Markdown Export Utility
 * Converts CV HTML content to Markdown format and triggers download
 */

/**
 * Converts HTML content to Markdown format
 * @param {HTMLElement} container - The container element with CV content
 * @returns {string} Markdown formatted text
 */
function htmlToMarkdown(container) {
	let markdown = "";
	const cvContent = container.cloneNode(true);

	// Remove unwanted elements (buttons, links that are not content)
	const elementsToRemove = cvContent.querySelectorAll(
		".print-button, .markdown-button, .print-menu-container, .back-link",
	);
	elementsToRemove.forEach((el) => el.remove());

	// Process the content
	processNode(cvContent);

	function processNode(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent.trim();
			if (text) {
				markdown += text + " ";
			}
			return;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) return;

		const tagName = node.tagName.toLowerCase();

		switch (tagName) {
			case "h1":
				markdown += "\n# " + node.textContent.trim() + "\n\n";
				break;
			case "h2":
				markdown += "\n## " + node.textContent.trim() + "\n\n";
				break;
			case "h3":
				markdown += "\n### " + node.textContent.trim() + "\n\n";
				break;
			case "h4":
				markdown += "\n#### " + node.textContent.trim() + "\n\n";
				break;
			case "h5":
				markdown += "\n##### " + node.textContent.trim() + "\n\n";
				break;
			case "h6":
				markdown += "\n###### " + node.textContent.trim() + "\n\n";
				break;
			case "p":
				markdown += "\n";
				node.childNodes.forEach((child) => processNode(child));
				markdown += "\n\n";
				break;
			case "strong":
			case "b":
				markdown += "**" + node.textContent.trim() + "**";
				break;
			case "em":
			case "i":
				markdown += "*" + node.textContent.trim() + "*";
				break;
			case "a": {
				const href = node.getAttribute("href");
				const text = node.textContent.trim();
				if (href && !href.startsWith("#")) {
					markdown += "[" + text + "](" + href + ")";
				} else {
					markdown += text;
				}
				break;
			}
			case "ul":
				markdown += "\n";
				Array.from(node.children).forEach((child) => {
					if (child.tagName.toLowerCase() === "li") {
						markdown += "- ";
						processNode(child);
					}
				});
				markdown += "\n";
				break;
			case "ol":
				markdown += "\n";
				Array.from(node.children).forEach((child, index) => {
					if (child.tagName.toLowerCase() === "li") {
						markdown += `${index + 1}. `;
						processNode(child);
					}
				});
				markdown += "\n";
				break;
			case "li":
				node.childNodes.forEach((child) => processNode(child));
				markdown += "\n";
				break;
			case "br":
				markdown += "\n";
				break;
			case "hr":
				markdown += "\n---\n\n";
				break;
			case "blockquote":
				markdown += "\n> ";
				node.childNodes.forEach((child) => processNode(child));
				markdown += "\n\n";
				break;
			case "code":
				markdown += "`" + node.textContent.trim() + "`";
				break;
			case "pre":
				markdown += "\n```\n" + node.textContent.trim() + "\n```\n\n";
				break;
			case "div":
			case "section":
			case "article":
			case "span":
				// Process children for container elements
				node.childNodes.forEach((child) => processNode(child));
				break;
			default:
				// For other elements, process their children
				node.childNodes.forEach((child) => processNode(child));
				break;
		}
	}

	// Clean up excessive whitespace
	markdown = markdown.replace(/\n\n\n+/g, "\n\n").trim();

	return markdown;
}

/**
 * Downloads the CV as a markdown file
 */
function _downloadAsMarkdown() {
	try {
		// Get the CV container
		const cvContainer = document.querySelector(".cv-container");
		if (!cvContainer) {
			alert("CV content not found");
			return;
		}

		// Convert to markdown
		const markdownContent = htmlToMarkdown(cvContainer);

		// Create a blob with the markdown content
		const blob = new Blob([markdownContent], { type: "text/markdown" });

		// Create a download link
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;

		// Generate filename based on page title or default
		const pageTitle = document.title || "cv";
		const filename = pageTitle
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
		link.download = filename + ".md";

		// Trigger download
		document.body.appendChild(link);
		link.click();

		// Cleanup
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Error downloading markdown:", error);
		alert("Error downloading markdown file. Please try again.");
	}
}
