import Image from "next/image";

export default function HeroSection() {
	return (
		<section
			className="hero-content"
			aria-label="DevSecOps architecture and services overview"
		>
			<div className="hero-content">
				<div className="hero-image-wrapper">
					<Image
						src="/assets/nabla/devops-aa.png"
						alt="Alban Andrieu DevSecOps architecture diagram featuring cloud platforms, security scanning, container orchestration, and AI/LLM engineering capabilities"
						className="hero-image"
						loading="eager"
						width={1200}
						height={600}
					/>
				</div>
				<div className="hero-text-overlay">
					<p>Your trusted partner for AI & Cloud</p>
				</div>
				<div className="hero-overlay"></div>
			</div>
		</section>
	);
}
