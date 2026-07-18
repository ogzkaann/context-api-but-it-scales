import { useEffect } from 'react';

import type { StateImplementation } from '../state/core/types';

const selectTheme = (state: { theme: 'light' | 'dark' }) => state.theme;

export function ThemeEffect({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  const theme = implementation.useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f5f5f3' : '#171816');
  }, [theme]);

  return null;
}
