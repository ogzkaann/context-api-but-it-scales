import {
  persistState,
  restorePersistedState,
  type StateStorage,
} from '../core/persistence';
import { DEFAULT_STATE, isAppState, statesEqual } from '../core/state';
import type { SyncChannel, SyncMessage } from '../core/sync';
import type { AppState, StateActions, StateSelector } from '../core/types';

const HISTORY_LIMIT = 50;

type Listener = () => void;

export type SelectorStore = Readonly<{
  getState: () => AppState;
  subscribe: (listener: Listener) => () => void;
  subscribeSelector: <T>(
    selector: StateSelector<T>,
    listener: Listener,
  ) => () => void;
  actions: StateActions;
  close: () => void;
}>;

export type StoreOptions = Readonly<{
  initialState?: AppState;
  storage?: StateStorage | null;
  channel?: SyncChannel | null;
  instanceId?: string;
}>;

export function createSelectorStore(options: StoreOptions = {}): SelectorStore {
  const storage = options.storage ?? null;
  const channel = options.channel ?? null;
  const instanceId = options.instanceId ?? createInstanceId();
  const restoredState = restorePersistedState(storage);
  let state = restoredState ?? options.initialState ?? DEFAULT_STATE;
  let past: AppState[] = [];
  let future: AppState[] = [];
  const listeners = new Set<Listener>();

  const publish = () => {
    channel?.post({ type: 'state-update', source: instanceId, state });
  };

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  const replaceState = (
    nextState: AppState,
    options: Readonly<{ recordHistory: boolean; broadcast: boolean }>,
  ) => {
    if (statesEqual(state, nextState)) {
      return;
    }

    if (options.recordHistory) {
      past = [...past.slice(-(HISTORY_LIMIT - 1)), state];
      future = [];
    }

    state = Object.freeze({ ...nextState });
    persistState(storage, state);
    notify();

    if (options.broadcast) {
      publish();
    }
  };

  const update = (recipe: (current: AppState) => AppState) => {
    replaceState(recipe(state), { recordHistory: true, broadcast: true });
  };

  const actions: StateActions = Object.freeze({
    toggleTheme: () => {
      update((current) => ({
        ...current,
        theme: current.theme === 'light' ? 'dark' : 'light',
      }));
    },
    incrementCart: () => {
      update((current) => ({
        ...current,
        cartCount: current.cartCount + 1,
      }));
    },
    incrementNotifications: () => {
      update((current) => ({
        ...current,
        notificationCount: current.notificationCount + 1,
      }));
    },
    undo: () => {
      const previous = past.at(-1);

      if (!previous) {
        return;
      }

      past = past.slice(0, -1);
      future = [state, ...future].slice(0, HISTORY_LIMIT);
      replaceState(previous, { recordHistory: false, broadcast: true });
    },
    redo: () => {
      const next = future[0];

      if (!next) {
        return;
      }

      future = future.slice(1);
      past = [...past.slice(-(HISTORY_LIMIT - 1)), state];
      replaceState(next, { recordHistory: false, broadcast: true });
    },
    reset: () => {
      replaceState(DEFAULT_STATE, { recordHistory: true, broadcast: true });
    },
  });

  const handleSyncMessage = (message: unknown) => {
    if (!isSyncMessage(message) || message.source === instanceId) {
      return;
    }

    replaceState(message.state, { recordHistory: true, broadcast: false });
  };

  const unsubscribeFromChannel = channel?.subscribe(handleSyncMessage) ?? null;

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeSelector: (selector, listener) => {
      let selected = selector(state);

      const handleChange = () => {
        const nextSelected = selector(state);

        if (!Object.is(selected, nextSelected)) {
          selected = nextSelected;
          listener();
        }
      };

      listeners.add(handleChange);
      return () => listeners.delete(handleChange);
    },
    actions,
    close: () => {
      unsubscribeFromChannel?.();
      channel?.close();
      listeners.clear();
    },
  };
}

function isSyncMessage(value: unknown): value is SyncMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === 'state-update' &&
    typeof candidate.source === 'string' &&
    isAppState(candidate.state)
  );
}

function createInstanceId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `store-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
