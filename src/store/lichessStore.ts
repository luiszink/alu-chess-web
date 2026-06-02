import { create } from 'zustand';
import { lichessApi } from '../api/lichessApi';
import type { LichessEvent, LichessStatus } from '../types/lichess';

const EVENT_LIMIT = 200;

type LichessState = {
  status: LichessStatus | null;
  loading: boolean;
  error: string | null;
  events: LichessEvent[];
  sseClose: (() => void) | null;

  refresh: () => Promise<void>;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
};

export const useLichessStore = create<LichessState>((set, get) => ({
  status: null,
  loading: false,
  error: null,
  events: [],
  sseClose: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const status = await lichessApi.status();
      set({ status, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  connect: () => {
    get().disconnect();
    const es = new EventSource(lichessApi.eventsUrl());
    const onMsg = (e: MessageEvent) => {
      try {
        const ev = JSON.parse(e.data) as LichessEvent;
        set((s) => ({ events: [...s.events, ev].slice(-EVENT_LIMIT) }));
        if (ev.type === 'gameStart' || ev.type === 'gameFinish' || ev.type === 'accepted') {
          // refresh status snapshot on lifecycle transitions
          get().refresh().catch(() => undefined);
        }
      } catch {
        /* ignore malformed frame */
      }
    };
    es.addEventListener('lichess', onMsg as EventListener);
    es.onerror = () => set({ error: 'SSE-Verbindung unterbrochen' });
    set({ sseClose: () => es.close(), error: null });
  },

  disconnect: () => {
    const close = get().sseClose;
    if (close) close();
    set({ sseClose: null });
  },

  clearEvents: () => set({ events: [] }),
}));
