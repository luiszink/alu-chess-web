import type { ControllerState, ErrorResponse } from '../types/chess';

const CTRL_URL = 'http://localhost:8081';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const err: ErrorResponse = await r.json();
    throw err;
  }
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

export const controllerApi = {
  getState: () => get<ControllerState>('/api/controller/state'),
  newGame: () => post<ControllerState>('/api/controller/new-game'),
  makeMove: (from: string, to: string, promotion?: string) =>
    post<ControllerState>('/api/controller/move', { from, to, promotion: promotion ?? null }),
  loadFen: (fen: string) =>
    post<ControllerState>('/api/controller/load-fen', { fen }),
  resign: () => post<ControllerState>('/api/controller/resign'),

  browseBack: () => post<ControllerState>('/api/controller/browse/back'),
  browseForward: () => post<ControllerState>('/api/controller/browse/forward'),
  browseToStart: () => post<ControllerState>('/api/controller/browse/to-start'),
  browseToEnd: () => post<ControllerState>('/api/controller/browse/to-end'),
  browseToMove: (index: number) =>
    post<ControllerState>('/api/controller/browse/to-move', { index }),

  getMoveHistory: () =>
    get<{ moves: import('../types/chess').MoveHistoryEntry[] }>('/api/controller/move-history'),

  getGames: () =>
    get<{ games: import('../types/chess').GameRecordSummary[] }>('/api/controller/games'),
  loadReplay: (id: string) =>
    post<ControllerState>('/api/controller/replay/load', { id }),
  exitReplay: () => post<ControllerState>('/api/controller/replay/exit'),

  exportGame: () => get<unknown>('/api/controller/export'),
  importGame: (jsonStr: string) =>
    fetch(`${CTRL_URL}/api/controller/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: jsonStr,
    }).then(r => json<ControllerState>(r)),
};
