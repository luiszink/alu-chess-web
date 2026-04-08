import type { ControllerState } from '../types/chess';

export function connectToGameEvents(
  onStateChange: (state: ControllerState) => void,
): () => void {
  let es: EventSource | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    es = new EventSource('http://localhost:8081/api/controller/events');

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
