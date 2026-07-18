import type { ComponentType, PropsWithChildren } from 'react';

export type Theme = 'light' | 'dark';

export type AppState = Readonly<{
  theme: Theme;
  cartCount: number;
  notificationCount: number;
}>;

export type StateSelector<T> = (state: AppState) => T;

export type StateActions = Readonly<{
  toggleTheme: () => void;
  incrementCart: () => void;
  incrementNotifications: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}>;

export type StateImplementation = Readonly<{
  name: 'naive' | 'optimized';
  Provider: ComponentType<PropsWithChildren>;
  useSelector: <T>(selector: StateSelector<T>) => T;
  useActions: () => StateActions;
}>;
