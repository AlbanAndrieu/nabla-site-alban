import type { ReactNode } from "react";
import styles from "./Action.module.css";

type ActionVariant = "primary" | "secondary";

type ActionLinkProps = Readonly<{
	href: string;
	variant?: ActionVariant;
	children: ReactNode;
}>;

export function actionClassName(variant: ActionVariant = "primary") {
	return `${styles.action} ${styles[variant]}`;
}

export default function ActionLink({
	href,
	variant = "primary",
	children,
}: ActionLinkProps) {
	return (
		<a href={href} className={actionClassName(variant)}>
			{children}
		</a>
	);
}
