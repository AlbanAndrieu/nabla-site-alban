import Image from "next/image";


export default function HeroSection() {
	return (
		<section
			className="expertise-hero"
			aria-label="DevSecOps architecture and services overview"
		>
			<div className="expertise-hero-container">
				<div
					className="expertise-hero-image-wrapper"
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Image
						src="/assets/nabla/devops-aa.png"
						alt="Alban Andrieu DevSecOps architecture diagram featuring cloud platforms, security scanning, container orchestration, and AI/LLM engineering capabilities"
						className="expertise-hero-image"
						priority
						width={1200}
						height={520}
						loading="eager"
						style={{ display: "inline-block", margin: "0 auto" }}
					/>
				</div>
				<div className="expertise-hero-overlay"></div>
			</div>
		</section>
	);
}
