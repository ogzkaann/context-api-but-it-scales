import { isAppState } from './state';
import type { AppState } from './types';

const PERSISTENCE_VERSION = 1;

type PersistedEnvelope = Readonly<{
  version: typeof PERSISTENCE_VERSION;
  state: AppState;
}>;

export type StateStorage = Readonly<{
  load: () => unknown;
  save: (value: PersistedEnvelope) => void;
}>;

export function restorePersistedState(
  storage: StateStorage | null,
): AppState | null {
  if (!storage) {
    return null;
  }

  try {
    const value = storage.load();

    if (!isPersistedEnvelope(value)) {
      return null;
    }

    return Object.freeze({ ...value.state });
  } catch {
    return null;
  }
}

export function persistState(
  storage: StateStorage | null,
  state: AppState,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.save({ version: PERSISTENCE_VERSION, state });
  } catch {
    // Storage can be unavailable in privacy modes or restricted frames.
  }
}

export function createBrowserStorage(key: string): StateStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window.localStorage;

    return {
      load: () => {
        const value = storage.getItem(key);
        return value === null ? null : (JSON.parse(value) as unknown);
      },
      save: (value) => {
        storage.setItem(key, JSON.stringify(value));
      },
    };
  } catch {
    return null;
  }
}

function isPersistedEnvelope(value: unknown): value is PersistedEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === PERSISTENCE_VERSION && isAppState(candidate.state)
  );
}
