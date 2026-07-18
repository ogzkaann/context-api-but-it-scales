import { memo } from 'react';

import { useRenderCount } from '../hooks/useRenderCount';
import { useRenderTracker } from '../measurement/RenderTrackerContext';
import type {
  AppState,
  StateImplementation,
  StateSelector,
} from '../state/core/types';
import { StateCard } from './StateCard';

const selectTheme: StateSelector<AppState['theme']> = (state) => state.theme;

export const ThemeCard = memo(function ThemeCard({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  const theme = implementation.useSelector(selectTheme);
  const actions = implementation.useActions();
  const renderCount = useRenderCount('Theme');
  const { trackAction } = useRenderTracker();

  return (
    <StateCard
      title="Theme"
      value={theme === 'light' ? 'Light' : 'Dark'}
      renderCount={renderCount}
      actionLabel={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}
      onAction={() => trackAction('Toggle theme', actions.toggleTheme)}
    />
  );
});
