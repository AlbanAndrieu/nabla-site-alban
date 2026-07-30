import Image from "next/image";

type Props = { label: string; imageAlt: string; tagline: string };

export default function HeroSection({ label, imageAlt, tagline }: Props) {
  return (
    <section className="hero-content" aria-label={label}>
      <div className="hero-content">
        <div className="hero-image-wrapper">
          <Image
            src="/assets/nabla/devops-aa.png"
            alt={imageAlt}
            className="hero-image"
            loading="eager"
            width={1200}
            height={600}
          />
        </div>
        <div className="hero-text-overlay">
          <h1>{tagline}</h1>
        </div>
        <div className="hero-overlay"></div>
      </div>
    </section>
  );
}
