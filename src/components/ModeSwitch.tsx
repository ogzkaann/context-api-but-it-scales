import type { Mode } from '../measurement/types';

type ModeSwitchProps = Readonly<{
  mode: Mode;
  onChange: (mode: Mode) => void;
}>;

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" role="group" aria-label="State mode">
      <button
        className="mode-switch__option"
        type="button"
        aria-pressed={mode === 'naive'}
        onClick={() => onChange('naive')}
      >
        Naive Context
      </button>
      <button
        className="mode-switch__option"
        type="button"
        aria-pressed={mode === 'optimized'}
        onClick={() => onChange('optimized')}
      >
        Optimized Context
      </button>
    </div>
  );
}
