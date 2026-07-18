import { useState } from 'react';

import { CartCard } from './components/CartCard';
import { ComparisonResult } from './components/ComparisonResult';
import { DirectComparison } from './components/DirectComparison';
import { ModeSwitch } from './components/ModeSwitch';
import { NotificationsCard } from './components/NotificationsCard';
import { ThemeCard } from './components/ThemeCard';
import { ThemeEffect } from './components/ThemeEffect';
import { UtilityControls } from './components/UtilityControls';
import { RenderTrackerProvider } from './measurement/RenderTrackerContext';
import { RenderTracker } from './measurement/renderTracker';
import type { Mode } from './measurement/types';
import type { StateImplementation } from './state/core/types';
import { naiveImplementation } from './state/naive';
import { optimizedImplementation } from './state/optimized';

export function App() {
  const [mode, setMode] = useState<Mode>('optimized');
  const [tracker] = useState(() => new RenderTracker());
  const implementation =
    mode === 'naive' ? naiveImplementation : optimizedImplementation;
  const Provider = implementation.Provider;

  return (
    <main className="page-shell">
      <header className="header">
        <div>
          <p className="kicker">Rendering laboratory</p>
          <h1>context-api-but-it-scales</h1>
          <p className="subtitle">
            A tiny experiment in not re-rendering everything.
          </p>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} />
      </header>

      <Provider key={mode}>
        <RenderTrackerProvider mode={mode} tracker={tracker}>
          <Demo implementation={implementation} />
        </RenderTrackerProvider>
      </Provider>

      <p className="strict-note">
        Counters record actual component executions. React Strict Mode may
        replay renders during development.
      </p>
    </main>
  );
}

function Demo({
  implementation,
}: Readonly<{ implementation: StateImplementation }>) {
  return (
    <>
      <ThemeEffect implementation={implementation} />
      <section className="cards" aria-label="State consumers">
        <ThemeCard implementation={implementation} />
        <CartCard implementation={implementation} />
        <NotificationsCard implementation={implementation} />
      </section>
      <ComparisonResult />
      <DirectComparison />
      <UtilityControls implementation={implementation} />
    </>
  );
}
