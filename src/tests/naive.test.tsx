import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  NaiveProvider,
  useNaiveActions,
  useNaiveSelector,
} from '../state/naive';

describe('naive context', () => {
  it('re-renders every shared-context consumer after a cart update', async () => {
    const user = userEvent.setup();
    const renders = { theme: 0, cart: 0, notifications: 0 };

    function ThemeConsumer() {
      const theme = useNaiveSelector((state) => state.theme);
      renders.theme += 1;
      return <span>{theme}</span>;
    }

    function CartConsumer() {
      const cart = useNaiveSelector((state) => state.cartCount);
      renders.cart += 1;
      return <span>{cart}</span>;
    }

    function NotificationConsumer() {
      const notifications = useNaiveSelector(
        (state) => state.notificationCount,
      );
      renders.notifications += 1;
      return <span>{notifications}</span>;
    }

    function CartButton() {
      const actions = useNaiveActions();
      return <button onClick={actions.incrementCart}>Increment</button>;
    }

    render(
      <NaiveProvider>
        <ThemeConsumer />
        <CartConsumer />
        <NotificationConsumer />
        <CartButton />
      </NaiveProvider>,
    );
    const before = { ...renders };

    await user.click(screen.getByRole('button', { name: 'Increment' }));

    expect(renders).toEqual({
      theme: before.theme + 1,
      cart: before.cart + 1,
      notifications: before.notifications + 1,
    });
  });
});
