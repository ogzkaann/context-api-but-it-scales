import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

import { useRenderCount } from '../hooks/useRenderCount';
import { RenderTrackerProvider } from '../measurement/RenderTrackerContext';
import { RenderTracker } from '../measurement/renderTracker';
import type { Mode, RenderedComponent } from '../measurement/types';
import type {
  AppState,
  StateActions,
  StateImplementation,
  StateSelector,
} from '../state/core/types';
import { NaiveProvider, naiveImplementation } from '../state/naive';
import { OptimizedProvider, optimizedImplementation } from '../state/optimized';
import { createSelectorStore } from '../state/optimized/store';

type ComparisonController = Readonly<{
  actions: StateActions;
  tracker: RenderTracker;
}>;

type ComparisonResult = Readonly<Record<Mode, number>>;

type RegisterController = (
  mode: Mode,
  controller: ComparisonController | null,
) => void;

const selectTheme = (state: AppState) => state.theme;
const selectCart = (state: AppState) => state.cartCount;
const selectNotifications = (state: AppState) => state.notificationCount;

export function DirectComparison() {
  const controllers = useRef<Partial<Record<Mode, ComparisonController>>>({});
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const registerController = useCallback<RegisterController>(
    (mode, controller) => {
      if (controller) {
        controllers.current[mode] = controller;
      } else {
        delete controllers.current[mode];
      }
    },
    [],
  );

  const runComparison = () => {
    const naive = controllers.current.naive;
    const optimized = controllers.current.optimized;

    if (!naive || !optimized) {
      return;
    }

    flushSync(() => {
      naive.actions.reset();
      optimized.actions.reset();
    });

    const finishNaive = naive.tracker.beginUpdate(
      'Compare cart update',
      'naive',
    );
    const finishOptimized = optimized.tracker.beginUpdate(
      'Compare cart update',
      'optimized',
    );

    flushSync(() => {
      naive.actions.incrementCart();
      optimized.actions.incrementCart();
    });

    finishNaive();
    finishOptimized();
    setResult({
      naive: naive.tracker.getSummary().components.length,
      optimized: optimized.tracker.getSummary().components.length,
    });
  };

  return (
    <>
      <section className="direct-comparison" aria-labelledby="comparison-title">
        <div className="direct-comparison__intro">
          <span className="eyebrow">Isolated comparison</span>
          <strong id="comparison-title">Equivalent clean Cart update</strong>
        </div>
        <div
          className="direct-comparison__result"
          role="status"
          aria-label="Isolated comparison result"
          aria-live="polite"
          aria-atomic="true"
        >
          {result ? (
            <>
              <span>
                Naive Context: <strong>{formatCount(result.naive)}</strong>
              </span>
              <span>
                Optimized Store:{' '}
                <strong>{formatCount(result.optimized)}</strong>
              </span>
            </>
          ) : (
            <span>Runs separately from the selected mode.</span>
          )}
        </div>
        <button className="button button--compare" onClick={runComparison}>
          Compare cart update
        </button>
      </section>

      <NaiveMeasurementBoundary onReady={registerController} />
      <OptimizedMeasurementBoundary onReady={registerController} />
    </>
  );
}

function NaiveMeasurementBoundary({
  onReady,
}: Readonly<{ onReady: RegisterController }>) {
  const [tracker] = useState(() => new RenderTracker());

  return (
    <NaiveProvider>
      <RenderTrackerProvider mode="naive" tracker={tracker}>
        <ControllerBridge
          implementation={naiveImplementation}
          mode="naive"
          onReady={onReady}
          tracker={tracker}
        />
        <MeasurementConsumers implementation={naiveImplementation} />
      </RenderTrackerProvider>
    </NaiveProvider>
  );
}

function OptimizedMeasurementBoundary({
  onReady,
}: Readonly<{ onReady: RegisterController }>) {
  const [store] = useState(() => createSelectorStore());
  const [tracker] = useState(() => new RenderTracker());

  useEffect(() => () => store.close(), [store]);

  return (
    <OptimizedProvider store={store}>
      <RenderTrackerProvider mode="optimized" tracker={tracker}>
        <ControllerBridge
          implementation={optimizedImplementation}
          mode="optimized"
          onReady={onReady}
          tracker={tracker}
        />
        <MeasurementConsumers implementation={optimizedImplementation} />
      </RenderTrackerProvider>
    </OptimizedProvider>
  );
}

function ControllerBridge({
  implementation,
  mode,
  onReady,
  tracker,
}: Readonly<{
  implementation: StateImplementation;
  mode: Mode;
  onReady: RegisterController;
  tracker: RenderTracker;
}>) {
  const actions = implementation.useActions();

  useLayoutEffect(() => {
    onReady(mode, { actions, tracker });
    return () => onReady(mode, null);
  }, [actions, mode, onReady, tracker]);

  return null;
}

function MeasurementConsumers({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  return (
    <>
      <MeasurementConsumer
        component="Theme"
        implementation={implementation}
        selector={selectTheme}
      />
      <MeasurementConsumer
        component="Cart"
        implementation={implementation}
        selector={selectCart}
      />
      <MeasurementConsumer
        component="Notifications"
        implementation={implementation}
        selector={selectNotifications}
      />
    </>
  );
}

function MeasurementConsumer<T>({
  component,
  implementation,
  selector,
}: Readonly<{
  component: RenderedComponent;
  implementation: StateImplementation;
  selector: StateSelector<T>;
}>) {
  implementation.useSelector(selector);
  useRenderCount(component);
  return null;
}

function formatCount(count: number): string {
  return `${count} ${count === 1 ? 'component' : 'components'} rendered`;
}
