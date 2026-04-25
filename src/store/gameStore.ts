import { create } from 'zustand';
import type {
  ControllerState,
  MoveHistoryEntry,
  ErrorResponse,
  EngineOptions,
  HealthResponse,
  BestMoveResponse,
  EvaluateResponse,
} from '../types/chess';
import { controllerApi } from '../api/controllerApi';
import { modelApi } from '../api/modelApi';
import { connectToGameEvents } from '../api/eventSource';
import toast from 'react-hot-toast';

interface EngineState {
  options: EngineOptions;
  health: HealthResponse | null;
  healthLoading: boolean;
  healthError: string | null;
  bestMove: BestMoveResponse | null;
  evaluation: EvaluateResponse | null;
  loadingBestMove: boolean;
  loadingEvaluation: boolean;
  error: string | null;
  lastAnalysedFen: string | null;
  isStale: boolean;
}

interface GameStore {
  state: ControllerState | null;
  moveHistory: MoveHistoryEntry[];
  loading: boolean;
  connected: boolean;
  engine: EngineState;
  activeGameId: string | null;

  // Actions
  setState: (state: ControllerState) => void;
  setActiveGameId: (gameId: string | null) => void;
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
  exitReplay: () => Promise<void>;
  refreshEngineHealth: () => Promise<void>;
  setEngineOptions: (options: Partial<EngineOptions>) => void;
  requestBestMove: (fen?: string) => Promise<void>;
  requestEvaluation: (fen?: string) => Promise<void>;
  clearEngineAnalysis: () => void;
  connectSSE: () => () => void;
}

const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  thinkTimeMs: 1000,
  skillLevel: 12,
  threads: 2,
  hashMb: 128,
};

const DEFAULT_ENGINE_STATE: EngineState = {
  options: DEFAULT_ENGINE_OPTIONS,
  health: null,
  healthLoading: false,
  healthError: null,
  bestMove: null,
  evaluation: null,
  loadingBestMove: false,
  loadingEvaluation: false,
  error: null,
  lastAnalysedFen: null,
  isStale: false,
};

let bestMoveRequestToken = 0;
let evaluationRequestToken = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getErrorMessage(err: unknown): string {
  const e = err as ErrorResponse;
  if (e?.message) return e.message;
  return 'Ein Fehler ist aufgetreten';
}

function isAnalysisStale(lastAnalysedFen: string | null, currentFen?: string): boolean {
  return Boolean(lastAnalysedFen && currentFen && lastAnalysedFen !== currentFen);
}

function handleError(err: unknown) {
  toast.error(getErrorMessage(err));
}

async function updateAfterAction(
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore,
  action: () => Promise<ControllerState>,
) {
  set({ loading: true });
  try {
    const s = await action();
    set((store) => ({
      state: s,
      loading: false,
      engine: {
        ...store.engine,
        isStale: isAnalysisStale(store.engine.lastAnalysedFen, s.game.fen),
      },
    }));
    const gameId = get().activeGameId;
    const hist = gameId
      ? await controllerApi.game(gameId).getMoveHistory()
      : await controllerApi.getMoveHistory();
    set({ moveHistory: hist.moves });
  } catch (err) {
    set({ loading: false });
    handleError(err);
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  moveHistory: [],
  loading: false,
  connected: false,
  engine: DEFAULT_ENGINE_STATE,
  activeGameId: null,

  setActiveGameId: (gameId) => set({ activeGameId: gameId }),

  setState: (state) => set((store) => ({
    state,
    engine: {
      ...store.engine,
      isStale: isAnalysisStale(store.engine.lastAnalysedFen, state.game.fen),
    },
  })),

  fetchState: async () => {
    try {
      const gameId = get().activeGameId;
      const s = gameId
        ? await controllerApi.game(gameId).getState()
        : await controllerApi.getState();
      set((store) => ({
        state: s,
        engine: {
          ...store.engine,
          isStale: isAnalysisStale(store.engine.lastAnalysedFen, s.game.fen),
        },
      }));
    } catch {
      // Server not available
    }
  },

  fetchMoveHistory: async () => {
    try {
      const gameId = get().activeGameId;
      const hist = gameId
        ? await controllerApi.game(gameId).getMoveHistory()
        : await controllerApi.getMoveHistory();
      set({ moveHistory: hist.moves });
    } catch {
      // ignore
    }
  },

  newGame: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).newGame() : controllerApi.newGame(),
    );
  },
  makeMove: (from, to, promotion) => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId
        ? controllerApi.game(gameId).makeMove(from, to, promotion)
        : controllerApi.makeMove(from, to, promotion),
    );
  },
  loadFen: (fen) => updateAfterAction(set, get, () => controllerApi.loadFen(fen)),
  resign: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).resign() : controllerApi.resign(),
    );
  },
  browseBack: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).browseBack() : controllerApi.browseBack(),
    );
  },
  browseForward: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).browseForward() : controllerApi.browseForward(),
    );
  },
  browseToStart: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).browseToStart() : controllerApi.browseToStart(),
    );
  },
  browseToEnd: () => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId ? controllerApi.game(gameId).browseToEnd() : controllerApi.browseToEnd(),
    );
  },
  browseToMove: (index) => {
    const gameId = get().activeGameId;
    return updateAfterAction(set, get,
      () => gameId
        ? controllerApi.game(gameId).browseToMove(index)
        : controllerApi.browseToMove(index),
    );
  },
  exitReplay: () => updateAfterAction(set, get, () => controllerApi.exitReplay()),

  refreshEngineHealth: async () => {
    set((store) => ({
      engine: {
        ...store.engine,
        healthLoading: true,
        healthError: null,
      },
    }));

    try {
      const health = await modelApi.getStockfishHealth();
      set((store) => ({
        engine: {
          ...store.engine,
          health,
          healthLoading: false,
          healthError: null,
        },
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set((store) => ({
        engine: {
          ...store.engine,
          healthLoading: false,
          healthError: message,
        },
      }));
      handleError(err);
    }
  },

  setEngineOptions: (options) => {
    set((store) => {
      const merged = { ...store.engine.options, ...options };
      const normalized: EngineOptions = {
        thinkTimeMs: clamp(Math.round(merged.thinkTimeMs), 100, 10000),
        skillLevel: clamp(Math.round(merged.skillLevel), 1, 20),
        threads: clamp(Math.round(merged.threads), 1, 16),
        hashMb: clamp(Math.round(merged.hashMb), 16, 1024),
      };

      return {
        engine: {
          ...store.engine,
          options: normalized,
        },
      };
    });
  },

  requestBestMove: async (fen) => {
    const currentFen = fen ?? get().state?.game.fen;
    if (!currentFen) {
      toast.error('Keine Stellung für Analyse verfügbar');
      return;
    }

    const requestToken = ++bestMoveRequestToken;
    const options = get().engine.options;
    set((store) => ({
      engine: {
        ...store.engine,
        loadingBestMove: true,
        error: null,
      },
    }));

    try {
      const bestMove = await modelApi.getBestMove(currentFen, options);
      if (requestToken !== bestMoveRequestToken) return;

      set((store) => ({
        engine: {
          ...store.engine,
          bestMove,
          loadingBestMove: false,
          lastAnalysedFen: currentFen,
          isStale: isAnalysisStale(currentFen, store.state?.game.fen),
        },
      }));
    } catch (err) {
      if (requestToken !== bestMoveRequestToken) return;
      const message = getErrorMessage(err);
      set((store) => ({
        engine: {
          ...store.engine,
          loadingBestMove: false,
          error: message,
        },
      }));
      handleError(err);
    }
  },

  requestEvaluation: async (fen) => {
    const currentFen = fen ?? get().state?.game.fen;
    if (!currentFen) {
      toast.error('Keine Stellung für Analyse verfügbar');
      return;
    }

    const requestToken = ++evaluationRequestToken;
    const options = get().engine.options;
    set((store) => ({
      engine: {
        ...store.engine,
        loadingEvaluation: true,
        error: null,
      },
    }));

    try {
      const evaluation = await modelApi.evaluatePosition(currentFen, options);
      if (requestToken !== evaluationRequestToken) return;

      set((store) => ({
        engine: {
          ...store.engine,
          evaluation,
          loadingEvaluation: false,
          lastAnalysedFen: currentFen,
          isStale: isAnalysisStale(currentFen, store.state?.game.fen),
        },
      }));
    } catch (err) {
      if (requestToken !== evaluationRequestToken) return;
      const message = getErrorMessage(err);
      set((store) => ({
        engine: {
          ...store.engine,
          loadingEvaluation: false,
          error: message,
        },
      }));
      handleError(err);
    }
  },

  clearEngineAnalysis: () => {
    set((store) => ({
      engine: {
        ...store.engine,
        bestMove: null,
        evaluation: null,
        loadingBestMove: false,
        loadingEvaluation: false,
        error: null,
        lastAnalysedFen: null,
        isStale: false,
      },
    }));
  },

  connectSSE: () => {
    const gameId = get().activeGameId;
    const eventsUrl = gameId
      ? controllerApi.game(gameId).eventsUrl()
      : undefined;

    const disconnect = connectToGameEvents(async (state) => {
      set((store) => ({
        state,
        connected: true,
        engine: {
          ...store.engine,
          isStale: isAnalysisStale(store.engine.lastAnalysedFen, state.game.fen),
        },
      }));
      try {
        const gid = get().activeGameId;
        const hist = gid
          ? await controllerApi.game(gid).getMoveHistory()
          : await controllerApi.getMoveHistory();
        set({ moveHistory: hist.moves });
      } catch {
        // ignore
      }
    }, eventsUrl);
    set({ connected: true });
    return disconnect;
  },
}));
