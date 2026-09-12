import type { ReactNode } from "react";
import AnchoredHeading from "@/components/AnchoredHeading";
import styles from "./SectionHeading.module.css";

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

type Props = {
	id: string;
	iconClass: string;
	children: ReactNode;
	as?: HeadingTag;
	className?: string;
};

export default function SectionHeading({
	id,
	iconClass,
	children,
	as = "h2",
	className,
}: Readonly<Props>) {
	return (
		<AnchoredHeading
			as={as}
			id={id}
			className={`${styles.heading} ${className ?? ""}`.trim()}
		>
			<span className={styles.icon} aria-hidden="true">
				<i className={`fas ${iconClass}`} />
			</span>
			<span className={styles.text}>{children}</span>
		</AnchoredHeading>
	);
}
