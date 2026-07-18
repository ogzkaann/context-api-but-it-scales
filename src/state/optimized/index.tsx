import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

import { createBrowserStorage } from '../core/persistence';
import { createBrowserChannel } from '../core/sync';
import type { StateImplementation, StateSelector } from '../core/types';
import { createSelectorStore, type SelectorStore } from './store';

const STORAGE_KEY = 'context-api-but-it-scales:state';
const CHANNEL_NAME = 'context-api-but-it-scales:sync';

const browserStore = createSelectorStore({
  storage: createBrowserStorage(STORAGE_KEY),
  channel: createBrowserChannel(CHANNEL_NAME),
});

const StoreContext = createContext<SelectorStore | null>(null);

type OptimizedProviderProps = PropsWithChildren<{
  store?: SelectorStore;
}>;

export function OptimizedProvider({
  children,
  store = browserStore,
}: OptimizedProviderProps) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useOptimizedSelector<T>(selector: StateSelector<T>): T {
  const store = useOptimizedStore();
  const subscribe = useCallback(
    (listener: () => void) => store.subscribeSelector(selector, listener),
    [selector, store],
  );
  const getSnapshot = useCallback(
    () => selector(store.getState()),
    [selector, store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useOptimizedActions() {
  return useOptimizedStore().actions;
}

export const optimizedImplementation: StateImplementation = {
  name: 'optimized',
  Provider: OptimizedProvider,
  useSelector: useOptimizedSelector,
  useActions: useOptimizedActions,
};

function useOptimizedStore(): SelectorStore {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error('Optimized state hooks require an OptimizedProvider.');
  }

  return store;
}
