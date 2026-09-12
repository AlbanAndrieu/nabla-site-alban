import type { ComponentPropsWithoutRef } from "react";
import {
	actionClassName,
	type ActionSize,
	type ActionVariant,
} from "./ActionLink";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
	variant?: ActionVariant;
	size?: ActionSize;
};

export default function Button({
	variant = "primary",
	size = "default",
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={actionClassName(variant, size, className)}
		/>
	);
}
