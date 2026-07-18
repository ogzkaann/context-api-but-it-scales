import { useSyncExternalStore } from 'react';

import { useRenderTracker } from '../measurement/RenderTrackerContext';

export function ComparisonResult() {
  const { tracker } = useRenderTracker();
  const summary = useSyncExternalStore(
    tracker.subscribe,
    tracker.getSummary,
    tracker.getSummary,
  );
  const rendered =
    summary.components.length === 0 ? 'None' : summary.components.join(', ');

  return (
    <section className="comparison" aria-live="polite" aria-atomic="true">
      <div>
        <span className="eyebrow">Last update</span>
        <strong>{summary.lastUpdate}</strong>
      </div>
      <div>
        <span className="eyebrow">Components rendered</span>
        <strong>{rendered}</strong>
      </div>
      <div className="comparison__observed">
        <ObservedCount label="Naive" count={summary.observed.naive} />
        <ObservedCount label="Optimized" count={summary.observed.optimized} />
      </div>
    </section>
  );
}

function ObservedCount({
  label,
  count,
}: Readonly<{ label: string; count: number | null }>) {
  return (
    <span>
      {label}: <strong>{count ?? '—'}</strong>
    </span>
  );
}
