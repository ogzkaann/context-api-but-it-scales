import { memo } from 'react';

import { useRenderCount } from '../hooks/useRenderCount';
import { useRenderTracker } from '../measurement/RenderTrackerContext';
import type { StateImplementation, StateSelector } from '../state/core/types';
import { StateCard } from './StateCard';

const selectNotifications: StateSelector<number> = (state) =>
  state.notificationCount;

export const NotificationsCard = memo(function NotificationsCard({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  const notificationCount = implementation.useSelector(selectNotifications);
  const actions = implementation.useActions();
  const renderCount = useRenderCount('Notifications');
  const { trackAction } = useRenderTracker();

  return (
    <StateCard
      title="Notifications"
      value={notificationCount.toLocaleString()}
      renderCount={renderCount}
      actionLabel="Add notification"
      onAction={() =>
        trackAction('Add notification', actions.incrementNotifications)
      }
    />
  );
});
