import type { AppState } from './types';

export const DEFAULT_STATE: AppState = Object.freeze({
  theme: 'light',
  cartCount: 0,
  notificationCount: 0,
});

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.theme === 'light' || candidate.theme === 'dark') &&
    isCount(candidate.cartCount) &&
    isCount(candidate.notificationCount)
  );
}

export function statesEqual(left: AppState, right: AppState): boolean {
  return (
    left.theme === right.theme &&
    left.cartCount === right.cartCount &&
    left.notificationCount === right.notificationCount
  );
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}
