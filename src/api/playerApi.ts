import type {
  PlayerResponse,
  GameSessionResponse,
  PlayerStatusResponse,
} from '../types/chess';

const CTRL_URL = '';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw await r.json();
  return r.json();
}

function post<T>(path: string, body?: object): Promise<T> {
  return fetch(`${CTRL_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => json<T>(r));
}

function get<T>(path: string): Promise<T> {
  return fetch(`${CTRL_URL}${path}`).then(r => json<T>(r));
}

export const playerApi = {
  register: (name: string) =>
    post<PlayerResponse>('/api/player/register', { name }),

  getStatus: (playerId: string) =>
    get<PlayerStatusResponse>(`/api/player/${playerId}/status`),

  createHvAISession: (playerId: string) =>
    post<GameSessionResponse>('/api/player/session/hvai', { playerId }),

  createHvHSession: (playerId: string) =>
    post<GameSessionResponse>('/api/player/session/hvh', { playerId }),

  joinHvHSession: (gameId: string, playerId: string) =>
    post<GameSessionResponse>(`/api/player/session/${gameId}/join`, { playerId }),

  listWaitingSessions: () =>
    get<{ sessions: GameSessionResponse[] }>('/api/player/sessions/waiting'),

  activateGame: (gameId: string, mode: 'HvAI' | 'HvH') =>
    post<{ gameId: string; status: string }>(
      `/api/controller/game/${gameId}/activate`,
      { mode },
    ),
};
