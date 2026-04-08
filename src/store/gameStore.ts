import { create } from 'zustand';
import type { ControllerState, MoveHistoryEntry, ErrorResponse } from '../types/chess';
import { controllerApi } from '../api/controllerApi';
import { connectToGameEvents } from '../api/eventSource';
import toast from 'react-hot-toast';

interface GameStore {
  state: ControllerState | null;
  moveHistory: MoveHistoryEntry[];
  loading: boolean;
  connected: boolean;

  // Actions
  setState: (state: ControllerState) => void;
  fetchState: () => Promise<void>;
  fetchMoveHistory: () => Promise<void>;
  newGame: () => Promise<void>;
  makeMove: (from: string, to: string, promotion?: string) => Promise<void>;
  loadFen: (fen: string) => Promise<void>;
  resign: () => Promise<void>;
  browseBack: () => Promise<void>;
  browseForward: () => Promise<void>;
  browseToStart: () => Promise<void>;
  browseToEnd: () => Promise<void>;
  browseToMove: (index: number) => Promise<void>;
  connectSSE: () => () => void;
}

function handleError(err: unknown) {
  const e = err as ErrorResponse;
  if (e?.message) {
    toast.error(e.message);
  } else {
    toast.error('Ein Fehler ist aufgetreten');
  }
}

async function updateAfterAction(
  set: (partial: Partial<GameStore>) => void,
  action: () => Promise<ControllerState>,
) {
  set({ loading: true });
  try {
    const s = await action();
    set({ state: s, loading: false });
    // Also refresh move history
    const hist = await controllerApi.getMoveHistory();
    set({ moveHistory: hist.moves });
  } catch (err) {
    set({ loading: false });
    handleError(err);
  }
}

export const useGameStore = create<GameStore>((set) => ({
  state: null,
  moveHistory: [],
  loading: false,
  connected: false,

  setState: (state) => set({ state }),

  fetchState: async () => {
    try {
      const s = await controllerApi.getState();
      set({ state: s });
    } catch {
      // Server not available
    }
  },

  fetchMoveHistory: async () => {
    try {
      const hist = await controllerApi.getMoveHistory();
      set({ moveHistory: hist.moves });
    } catch {
      // ignore
    }
  },

  newGame: () => updateAfterAction(set, () => controllerApi.newGame()),
  makeMove: (from, to, promotion) =>
    updateAfterAction(set, () => controllerApi.makeMove(from, to, promotion)),
  loadFen: (fen) => updateAfterAction(set, () => controllerApi.loadFen(fen)),
  resign: () => updateAfterAction(set, () => controllerApi.resign()),
  browseBack: () => updateAfterAction(set, () => controllerApi.browseBack()),
  browseForward: () => updateAfterAction(set, () => controllerApi.browseForward()),
  browseToStart: () => updateAfterAction(set, () => controllerApi.browseToStart()),
  browseToEnd: () => updateAfterAction(set, () => controllerApi.browseToEnd()),
  browseToMove: (index) => updateAfterAction(set, () => controllerApi.browseToMove(index)),

  connectSSE: () => {
    const disconnect = connectToGameEvents(async (state) => {
      set({ state, connected: true });
      try {
        const hist = await controllerApi.getMoveHistory();
        set({ moveHistory: hist.moves });
      } catch {
        // ignore
      }
    });
    set({ connected: true });
    return disconnect;
  },
}));
