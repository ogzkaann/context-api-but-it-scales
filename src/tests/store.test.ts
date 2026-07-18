import { describe, expect, it, vi } from 'vitest';

import type { StateStorage } from '../state/core/persistence';
import type { SyncChannel, SyncMessage } from '../state/core/sync';
import { createSelectorStore } from '../state/optimized/store';

describe('selector store', () => {
  it('notifies the cart selector without notifying unrelated selectors', () => {
    const store = createSelectorStore();
    const cartListener = vi.fn();
    const themeListener = vi.fn();
    const notificationListener = vi.fn();

    store.subscribeSelector((state) => state.cartCount, cartListener);
    store.subscribeSelector((state) => state.theme, themeListener);
    store.subscribeSelector(
      (state) => state.notificationCount,
      notificationListener,
    );

    store.actions.incrementCart();

    expect(store.getState().cartCount).toBe(1);
    expect(cartListener).toHaveBeenCalledOnce();
    expect(themeListener).not.toHaveBeenCalled();
    expect(notificationListener).not.toHaveBeenCalled();
  });

  it('undoes and redoes immutable updates in order', () => {
    const store = createSelectorStore();

    store.actions.incrementCart();
    store.actions.incrementNotifications();
    expect(store.getState()).toMatchObject({
      cartCount: 1,
      notificationCount: 1,
    });

    store.actions.undo();
    expect(store.getState()).toMatchObject({
      cartCount: 1,
      notificationCount: 0,
    });

    store.actions.undo();
    expect(store.getState()).toMatchObject({
      cartCount: 0,
      notificationCount: 0,
    });

    store.actions.redo();
    store.actions.redo();
    expect(store.getState()).toMatchObject({
      cartCount: 1,
      notificationCount: 1,
    });
  });

  it('restores a safely persisted state', () => {
    let persisted: unknown = null;
    const storage: StateStorage = {
      load: () => persisted,
      save: (value) => {
        persisted = value;
      },
    };
    const firstStore = createSelectorStore({ storage });

    firstStore.actions.incrementCart();
    firstStore.actions.toggleTheme();

    const restoredStore = createSelectorStore({ storage });
    expect(restoredStore.getState()).toEqual({
      theme: 'dark',
      cartCount: 1,
      notificationCount: 0,
    });
  });

  it.each([
    { version: 1, state: { theme: 'sepia', cartCount: 1 } },
    { version: 99, state: { theme: 'dark', cartCount: 1 } },
    'not an envelope',
  ])('ignores invalid persisted data: %j', (persisted) => {
    const storage: StateStorage = {
      load: () => persisted,
      save: vi.fn(),
    };

    expect(() => createSelectorStore({ storage })).not.toThrow();
    expect(createSelectorStore({ storage }).getState()).toEqual({
      theme: 'light',
      cartCount: 0,
      notificationCount: 0,
    });
  });

  it('survives storage access failures', () => {
    const storage: StateStorage = {
      load: () => {
        throw new DOMException('Storage blocked');
      },
      save: () => {
        throw new DOMException('Storage blocked');
      },
    };
    const store = createSelectorStore({ storage });

    expect(() => store.actions.incrementCart()).not.toThrow();
    expect(store.getState().cartCount).toBe(1);
  });

  it('applies cross-tab updates without broadcasting a loop', () => {
    const { first, second, posts } = createChannelPair();
    const firstStore = createSelectorStore({
      channel: first,
      instanceId: 'first-tab',
    });
    const secondStore = createSelectorStore({
      channel: second,
      instanceId: 'second-tab',
    });

    firstStore.actions.incrementCart();

    expect(firstStore.getState().cartCount).toBe(1);
    expect(secondStore.getState().cartCount).toBe(1);
    expect(posts.first).toBe(1);
    expect(posts.second).toBe(0);

    secondStore.actions.incrementNotifications();

    expect(firstStore.getState().notificationCount).toBe(1);
    expect(secondStore.getState().notificationCount).toBe(1);
    expect(posts.first).toBe(1);
    expect(posts.second).toBe(1);
  });
});

function createChannelPair(): Readonly<{
  first: SyncChannel;
  second: SyncChannel;
  posts: { first: number; second: number };
}> {
  let firstListener: ((message: unknown) => void) | null = null;
  let secondListener: ((message: unknown) => void) | null = null;
  const posts = { first: 0, second: 0 };

  const first: SyncChannel = {
    post: (message: SyncMessage) => {
      posts.first += 1;
      secondListener?.(message);
    },
    subscribe: (listener) => {
      firstListener = listener;
      return () => {
        firstListener = null;
      };
    },
    close: vi.fn(),
  };
  const second: SyncChannel = {
    post: (message: SyncMessage) => {
      posts.second += 1;
      firstListener?.(message);
    },
    subscribe: (listener) => {
      secondListener = listener;
      return () => {
        secondListener = null;
      };
    },
    close: vi.fn(),
  };

  return { first, second, posts };
}
