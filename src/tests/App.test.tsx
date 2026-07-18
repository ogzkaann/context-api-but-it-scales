import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';

describe('render comparison UI', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('only re-renders the cart card for an optimized cart update', async () => {
    const user = userEvent.setup();
    render(<App />);
    const before = readRenderCounts();

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cart' })).toBeInTheDocument();
      expect(readRenderCounts().cart).toBeGreaterThan(before.cart);
    });
    const after = readRenderCounts();
    expect(after.theme).toBe(before.theme);
    expect(after.notifications).toBe(before.notifications);
    expect(screen.getByText('Optimized:')).toHaveTextContent('Optimized: 1');
    expect(
      screen.getByText('Components rendered').nextSibling,
    ).toHaveTextContent('Cart');
  });

  it('shows the wider render fan-out in naive mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Naive Context' }));
    const before = readRenderCounts();
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => {
      expect(readRenderCounts().cart).toBeGreaterThan(before.cart);
    });
    const after = readRenderCounts();
    expect(after.theme).toBeGreaterThan(before.theme);
    expect(after.notifications).toBeGreaterThan(before.notifications);
    expect(screen.getByText('Naive:')).toHaveTextContent('Naive: 3');
  });

  it('operates primary controls from the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    const addToCart = screen.getByRole('button', { name: 'Add to cart' });
    const cartCard = screen
      .getByRole('heading', { name: 'Cart' })
      .closest('article');

    expect(cartCard).not.toBeNull();
    const initialCartCount = readCardValue(cartCard!);
    addToCart.focus();
    await user.keyboard('{Enter}');
    expect(readCardValue(cartCard!)).toBe(initialCartCount + 1);

    const undo = screen.getByRole('button', { name: 'Undo' });
    undo.focus();
    await user.keyboard(' ');
    expect(readCardValue(cartCard!)).toBe(initialCartCount);

    const naiveMode = screen.getByRole('button', { name: 'Naive Context' });
    naiveMode.focus();
    await user.keyboard('{Enter}');
    expect(naiveMode).toHaveAttribute('aria-pressed', 'true');
  });
});

function readRenderCounts() {
  return {
    theme: readCardRenderCount('Theme'),
    cart: readCardRenderCount('Cart'),
    notifications: readCardRenderCount('Notifications'),
  };
}

function readCardRenderCount(name: string): number {
  const card = screen.getByRole('heading', { name }).closest('article');
  const label = within(card!).getByLabelText(/\d+ renders/).textContent ?? '';
  return Number(label.replace('Render ', ''));
}

function readCardValue(card: HTMLElement): number {
  return Number(card.querySelector('.state-card__value')?.textContent ?? 'NaN');
}
