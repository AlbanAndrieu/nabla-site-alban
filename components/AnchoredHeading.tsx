import type { ReactNode } from "react";
import styles from "./AnchoredHeading.module.css";

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

type Props = {
	as?: HeadingTag;
	id: string;
	className?: string;
	children: ReactNode;
};

export default function AnchoredHeading({
	as: Tag = "h2",
	id,
	className,
	children,
}: Props) {
	return (
		<Tag id={id} className={`${styles.heading} ${className ?? ""}`.trim()}>
			<a className={styles.permalink} href={`#${id}`}>
				{children}
				<span className={styles.hash} aria-hidden="true">
					#
				</span>
			</a>
		</Tag>
	);
}
