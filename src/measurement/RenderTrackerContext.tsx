import {
  createContext,
  useCallback,
  useContext,
  type PropsWithChildren,
} from 'react';

import type { Mode } from './types';
import { RenderTracker } from './renderTracker';

type TrackAction = (label: string, action: () => void) => void;

const TrackerContext = createContext<
  Readonly<{ tracker: RenderTracker; trackAction: TrackAction }> | undefined
>(undefined);

type RenderTrackerProviderProps = PropsWithChildren<{
  mode: Mode;
  tracker: RenderTracker;
}>;

export function RenderTrackerProvider({
  children,
  mode,
  tracker,
}: RenderTrackerProviderProps) {
  const trackAction = useCallback<TrackAction>(
    (label, action) => {
      const finish = tracker.beginUpdate(label, mode);
      action();

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(finish);
      } else {
        queueMicrotask(finish);
      }
    },
    [mode, tracker],
  );

  return (
    <TrackerContext.Provider value={{ tracker, trackAction }}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useRenderTracker() {
  const context = useContext(TrackerContext);

  if (!context) {
    throw new Error('Render measurement requires a RenderTrackerProvider.');
  }

  return context;
}
