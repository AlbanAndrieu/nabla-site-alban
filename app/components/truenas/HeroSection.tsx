type Props = {
  ariaLabel: string;
  title: string;
  lead: string;
  credit: string;
  topics: string;
};

export default function HeroSection({
  ariaLabel,
  title,
  lead,
  credit,
  topics,
}: Props) {
  return (
    <section className="truenas-hero" aria-label={ariaLabel}>
      <div className="container py-4 mb-2">
        <h1 className="display-4 mb-2 text-center">{title}</h1>
        <p className="lead mb-1 text-center">{lead}</p>
        <p className="lead text-center small text-muted">
          {credit} <br />
          {topics}
        </p>
      </div>
    </section>
  );
}
