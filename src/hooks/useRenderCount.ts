import { useLayoutEffect, useRef } from 'react';

import { useRenderTracker } from '../measurement/RenderTrackerContext';
import type { RenderedComponent } from '../measurement/types';

/* eslint-disable react-hooks/refs -- This diagnostic hook intentionally counts render executions without scheduling another render. */
export function useRenderCount(component: RenderedComponent): number {
  const count = useRef(0);
  const { tracker } = useRenderTracker();
  count.current += 1;

  useLayoutEffect(() => {
    tracker.recordRender(component, count.current);
  });

  return count.current;
}
