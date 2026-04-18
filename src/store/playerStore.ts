import { create } from 'zustand';
import type { Color, GameSessionResponse } from '../types/chess';
import { playerApi } from '../api/playerApi';

interface PlayerStore {
  playerId:   string | null;
  playerName: string | null;
  gameId:     string | null;
  color:      Color | null;
  session:    GameSessionResponse | null;
  loading:    boolean;
  error:      string | null;

  register:          (name: string) => Promise<void>;
  createHvAISession: () => Promise<string | null>;
  createHvHSession:  () => Promise<string | null>;
  joinHvHSession:    (gameId: string) => Promise<string | null>;
  pollUntilActive:   () => Promise<string | null>;
  reset:             () => void;
}

function getMsg(e: unknown): string {
  const err = e as { error?: string; message?: string };
  return err?.message ?? err?.error ?? 'Ein Fehler ist aufgetreten';
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  playerId:   null,
  playerName: null,
  gameId:     null,
  color:      null,
  session:    null,
  loading:    false,
  error:      null,

  register: async (name) => {
    set({ loading: true, error: null });
    try {
      const player = await playerApi.register(name);
      set({ playerId: player.id, playerName: name, loading: false });
    } catch (e) {
      set({ loading: false, error: getMsg(e) });
      throw e;
    }
  },

  createHvAISession: async () => {
    const { playerId } = get();
    if (!playerId) return null;
    set({ loading: true, error: null });
    try {
      const session = await playerApi.createHvAISession(playerId);
      await playerApi.activateGame(session.id, 'HvAI');
      set({ gameId: session.id, session, color: 'White', loading: false });
      return session.id;
    } catch (e) {
      set({ loading: false, error: getMsg(e) });
      return null;
    }
  },

  createHvHSession: async () => {
    const { playerId } = get();
    if (!playerId) return null;
    set({ loading: true, error: null });
    try {
      const session = await playerApi.createHvHSession(playerId);
      set({ gameId: session.id, session, color: 'White', loading: false });
      return session.id;
    } catch (e) {
      set({ loading: false, error: getMsg(e) });
      return null;
    }
  },

  joinHvHSession: async (gameId) => {
    const { playerId } = get();
    if (!playerId) return null;
    set({ loading: true, error: null });
    try {
      const session = await playerApi.joinHvHSession(gameId, playerId);
      set({ gameId: session.id, session, color: 'Black', loading: false });
      return session.id;
    } catch (e) {
      set({ loading: false, error: getMsg(e) });
      return null;
    }
  },

  pollUntilActive: async () => {
    const { playerId } = get();
    if (!playerId) return null;

    const poll = async (): Promise<string | null> => {
      const status = await playerApi.getStatus(playerId);
      if (status.session?.status === 'Active') {
        const gid = status.player.gameId!;
        await playerApi.activateGame(gid, 'HvH');
        set({
          gameId:  gid,
          session: status.session,
          color:   status.player.color,
        });
        return gid;
      }
      await new Promise<void>(r => setTimeout(r, 2000));
      return poll();
    };

    return poll();
  },

  reset: () => set({
    playerId: null, playerName: null, gameId: null,
    color: null, session: null, loading: false, error: null,
  }),
}));
