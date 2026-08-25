export function formatEuro(locale: string, amount: number): string {
	return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}
