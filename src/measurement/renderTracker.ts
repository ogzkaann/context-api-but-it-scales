import type { Mode, RenderedComponent } from './types';

const COMPONENTS: readonly RenderedComponent[] = [
  'Theme',
  'Cart',
  'Notifications',
];

export type RenderSummary = Readonly<{
  lastUpdate: string;
  lastMode: Mode | null;
  components: readonly RenderedComponent[];
  observed: Readonly<Record<Mode, number | null>>;
}>;

type Listener = () => void;

const EMPTY_SUMMARY: RenderSummary = Object.freeze({
  lastUpdate: 'No update yet',
  lastMode: null,
  components: [],
  observed: Object.freeze({ naive: null, optimized: null }),
});

export class RenderTracker {
  private readonly counts = new Map<RenderedComponent, number>();
  private readonly listeners = new Set<Listener>();
  private summary: RenderSummary = EMPTY_SUMMARY;

  recordRender(component: RenderedComponent, count: number): void {
    this.counts.set(component, count);
  }

  beginUpdate(label: string, mode: Mode): () => void {
    const before = new Map(this.counts);

    return () => {
      const components = COMPONENTS.filter(
        (component) =>
          (this.counts.get(component) ?? 0) > (before.get(component) ?? 0),
      );

      this.summary = Object.freeze({
        lastUpdate: label,
        lastMode: mode,
        components,
        observed: Object.freeze({
          ...this.summary.observed,
          [mode]: components.length,
        }),
      });
      this.listeners.forEach((listener) => listener());
    };
  }

  getSummary = (): RenderSummary => this.summary;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}
