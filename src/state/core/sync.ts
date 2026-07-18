import type { AppState } from './types';

export type SyncMessage = Readonly<{
  type: 'state-update';
  source: string;
  state: AppState;
}>;

export type SyncChannel = Readonly<{
  post: (message: SyncMessage) => void;
  subscribe: (listener: (message: unknown) => void) => () => void;
  close: () => void;
}>;

export function createBrowserChannel(name: string): SyncChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }

  try {
    const channel = new BroadcastChannel(name);

    return {
      post: (message) => {
        try {
          channel.postMessage(message);
        } catch {
          // A closing tab may invalidate the channel between checks.
        }
      },
      subscribe: (listener) => {
        const handleMessage = (event: MessageEvent<unknown>) => {
          listener(event.data);
        };

        channel.addEventListener('message', handleMessage);
        return () => channel.removeEventListener('message', handleMessage);
      },
      close: () => channel.close(),
    };
  } catch {
    return null;
  }
}
