import type { ControllerState } from '../types/chess';

const DEFAULT_EVENTS_URL = '/api/controller/events';

export function connectToGameEvents(
  onStateChange: (state: ControllerState) => void,
  eventsUrl?: string,
): () => void {
  const url = eventsUrl ?? DEFAULT_EVENTS_URL;
  let es: EventSource | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    es = new EventSource(url);

    es.addEventListener('state', (e) => {
      const state: ControllerState = JSON.parse(e.data);
      onStateChange(state);
    });

    es.onerror = () => {
      es?.close();
      if (!closed) {
        setTimeout(connect, 3000);
      }
    };
  }

  connect();

  return () => {
    closed = true;
    es?.close();
  };
}
