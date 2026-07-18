import { memo } from 'react';

import { useRenderCount } from '../hooks/useRenderCount';
import { useRenderTracker } from '../measurement/RenderTrackerContext';
import type { StateImplementation, StateSelector } from '../state/core/types';
import { StateCard } from './StateCard';

const selectCart: StateSelector<number> = (state) => state.cartCount;

export const CartCard = memo(function CartCard({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  const cartCount = implementation.useSelector(selectCart);
  const actions = implementation.useActions();
  const renderCount = useRenderCount('Cart');
  const { trackAction } = useRenderTracker();

  return (
    <StateCard
      title="Cart"
      value={cartCount.toLocaleString()}
      renderCount={renderCount}
      actionLabel="Add to cart"
      onAction={() => trackAction('Add to cart', actions.incrementCart)}
    />
  );
});
