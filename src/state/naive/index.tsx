import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

import { DEFAULT_STATE } from '../core/state';
import type {
  AppState,
  StateActions,
  StateImplementation,
  StateSelector,
} from '../core/types';

const HISTORY_LIMIT = 50;

type HistoryState = Readonly<{
  present: AppState;
  past: readonly AppState[];
  future: readonly AppState[];
}>;

type Action =
  | { type: 'toggle-theme' }
  | { type: 'increment-cart' }
  | { type: 'increment-notifications' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' };

type NaiveContextValue = Readonly<{
  state: AppState;
  actions: StateActions;
}>;

const NaiveContext = createContext<NaiveContextValue | null>(null);

const INITIAL_HISTORY: HistoryState = {
  present: DEFAULT_STATE,
  past: [],
  future: [],
};

export function NaiveProvider({ children }: PropsWithChildren) {
  const [history, dispatch] = useReducer(reducer, INITIAL_HISTORY);
  const actions = useMemo<StateActions>(
    () => ({
      toggleTheme: () => dispatch({ type: 'toggle-theme' }),
      incrementCart: () => dispatch({ type: 'increment-cart' }),
      incrementNotifications: () =>
        dispatch({ type: 'increment-notifications' }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [],
  );
  const value = useMemo(
    () => ({ state: history.present, actions }),
    [actions, history.present],
  );

  return (
    <NaiveContext.Provider value={value}>{children}</NaiveContext.Provider>
  );
}

export function useNaiveSelector<T>(selector: StateSelector<T>): T {
  return selector(useNaiveContext().state);
}

export function useNaiveActions(): StateActions {
  return useNaiveContext().actions;
}

export const naiveImplementation: StateImplementation = {
  name: 'naive',
  Provider: NaiveProvider,
  useSelector: useNaiveSelector,
  useActions: useNaiveActions,
};

function useNaiveContext(): NaiveContextValue {
  const value = useContext(NaiveContext);

  if (!value) {
    throw new Error('Naive state hooks require a NaiveProvider.');
  }

  return value;
}

function reducer(history: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'toggle-theme':
      return push(history, {
        ...history.present,
        theme: history.present.theme === 'light' ? 'dark' : 'light',
      });
    case 'increment-cart':
      return push(history, {
        ...history.present,
        cartCount: history.present.cartCount + 1,
      });
    case 'increment-notifications':
      return push(history, {
        ...history.present,
        notificationCount: history.present.notificationCount + 1,
      });
    case 'reset':
      return push(history, DEFAULT_STATE);
    case 'undo': {
      const previous = history.past.at(-1);

      if (!previous) {
        return history;
      }

      return {
        present: previous,
        past: history.past.slice(0, -1),
        future: [history.present, ...history.future].slice(0, HISTORY_LIMIT),
      };
    }
    case 'redo': {
      const next = history.future[0];

      if (!next) {
        return history;
      }

      return {
        present: next,
        past: [...history.past.slice(-(HISTORY_LIMIT - 1)), history.present],
        future: history.future.slice(1),
      };
    }
  }
}

function push(history: HistoryState, present: AppState): HistoryState {
  if (
    history.present.theme === present.theme &&
    history.present.cartCount === present.cartCount &&
    history.present.notificationCount === present.notificationCount
  ) {
    return history;
  }

  return {
    present,
    past: [...history.past.slice(-(HISTORY_LIMIT - 1)), history.present],
    future: [],
  };
}
