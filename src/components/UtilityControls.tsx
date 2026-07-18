import { useRenderTracker } from '../measurement/RenderTrackerContext';
import type { StateImplementation } from '../state/core/types';

type UtilityControlsProps = Readonly<{
  implementation: StateImplementation;
}>;

export function UtilityControls({ implementation }: UtilityControlsProps) {
  const actions = implementation.useActions();
  const { trackAction } = useRenderTracker();

  return (
    <div className="utility-controls" aria-label="State history controls">
      <button
        className="button button--quiet"
        type="button"
        onClick={() => trackAction('Undo', actions.undo)}
      >
        Undo
      </button>
      <button
        className="button button--quiet"
        type="button"
        onClick={() => trackAction('Redo', actions.redo)}
      >
        Redo
      </button>
      <button
        className="button button--quiet"
        type="button"
        onClick={() => trackAction('Reset', actions.reset)}
      >
        Reset
      </button>
      <button
        className="button button--quiet"
        type="button"
        onClick={() => window.open(window.location.href, '_blank', 'noopener')}
      >
        Open second tab
      </button>
    </div>
  );
}
