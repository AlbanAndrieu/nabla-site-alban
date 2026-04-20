/**
 * Combined Print/Export Menu Utility
 * Provides a dropdown menu for print as PDF (default) and export as markdown
 */

/**
 * Toggles the dropdown menu visibility
 */
function _togglePrintMenu(event) {
	event.stopPropagation();
	const menu = document.getElementById("print-menu-dropdown");
	const button = event.currentTarget;
	const arrow = button.querySelector(".dropdown-arrow");
	const isVisible = menu.style.display === "block";

	if (isVisible) {
		menu.style.display = "none";
		button.setAttribute("aria-expanded", "false");
		if (arrow) {
			arrow.style.transform = "rotate(0deg)";
		}
	} else {
		menu.style.display = "block";
		button.setAttribute("aria-expanded", "true");
		if (arrow) {
			arrow.style.transform = "rotate(180deg)";
		}
		// Focus first menu item for keyboard accessibility
		const firstMenuItem = menu.querySelector("button");
		if (firstMenuItem) {
			setTimeout(() => firstMenuItem.focus(), 0);
		}
	}
}

/**
 * Handles the print as PDF action
 */
function _handlePrintPDF() {
	window.print();
	closePrintMenu();
}

/**
 * Handles the export as markdown action
 */
function _handleExportMarkdown() {
	downloadAsMarkdown();
	closePrintMenu();
}

/**
 * Closes the dropdown menu
 */
function closePrintMenu() {
	const menu = document.getElementById("print-menu-dropdown");
	const button = document.querySelector(".print-menu-button");
	const arrow = button ? button.querySelector(".dropdown-arrow") : null;

	if (menu) {
		menu.style.display = "none";
	}
	if (button) {
		button.setAttribute("aria-expanded", "false");
	}
	if (arrow) {
		arrow.style.transform = "rotate(0deg)";
	}
}

/**
 * Initialize event listeners when DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", () => {
	const menu = document.getElementById("print-menu-dropdown");
	const button = document.querySelector(".print-menu-button");

	// Close menu when clicking outside
	document.addEventListener("click", (event) => {
		if (
			menu &&
			button &&
			!button.contains(event.target) &&
			!menu.contains(event.target)
		) {
			closePrintMenu();
		}
	});

	// Keyboard navigation in dropdown menu
	if (menu) {
		menu.addEventListener("keydown", (event) => {
			const menuItems = Array.from(menu.querySelectorAll("button"));
			const currentIndex = menuItems.indexOf(document.activeElement);

			if (event.key === "ArrowDown") {
				event.preventDefault();
				const nextIndex = (currentIndex + 1) % menuItems.length;
				menuItems[nextIndex].focus();
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				const prevIndex =
					(currentIndex - 1 + menuItems.length) % menuItems.length;
				menuItems[prevIndex].focus();
			} else if (event.key === "Escape") {
				event.preventDefault();
				closePrintMenu();
				if (button) {
					button.focus();
				}
			}
		});
	}

	// Close menu on escape key globally
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && menu && menu.style.display === "block") {
			closePrintMenu();
			if (button) {
				button.focus();
			}
		}
	});
});
