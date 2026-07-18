type StateCardProps = Readonly<{
  title: string;
  value: string;
  renderCount: number;
  actionLabel: string;
  onAction: () => void;
}>;

export function StateCard({
  title,
  value,
  renderCount,
  actionLabel,
  onAction,
}: StateCardProps) {
  return (
    <article className="state-card" aria-labelledby={`${title}-title`}>
      <div className="state-card__topline">
        <h2 id={`${title}-title`}>{title}</h2>
        <span className="render-count" aria-label={`${renderCount} renders`}>
          Render {renderCount}
        </span>
      </div>
      <strong className="state-card__value">{value}</strong>
      <button className="button button--card" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </article>
  );
}
