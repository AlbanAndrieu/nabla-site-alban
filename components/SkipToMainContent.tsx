import { getTranslations } from "next-intl/server";

type SkipToMainContentProps = {
	targetId?: string;
};

export default async function SkipToMainContent({
	targetId = "main-content",
}: SkipToMainContentProps) {
	const t = await getTranslations("site");

	return (
		<a href={`#${targetId}`} className="skip-to-main">
			{t("skipToMainContent")}
		</a>
	);
}
