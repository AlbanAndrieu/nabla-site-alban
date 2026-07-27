// components/CisoRssClient.tsx

"use client";
import dynamic from "next/dynamic";

const CisoRssWidget = dynamic(() => import("./CisoRssWidget"), { ssr: false });

export default function CisoRssClient({ isFr }: { isFr: boolean }) {
	return <CisoRssWidget isFr={isFr} />;
}
