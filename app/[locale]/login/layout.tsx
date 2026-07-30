import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export const metadata: Metadata = { robots: NON_INDEXABLE_ROBOTS };

export default function LoginLayout({ children }: { children: ReactNode }) {
	return children;
}
