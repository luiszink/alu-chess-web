import type { LichessStatus } from '../types/lichess';

const BASE = '/api/lichess';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = (j && (j.error || j.message)) || '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface CreateChallengeRequest {
  username: string;
  limitSeconds: number;
  incrementSeconds: number;
  rated: boolean;
  color: 'random' | 'white' | 'black';
}

export const lichessApi = {
  status: (): Promise<LichessStatus> => fetch(`${BASE}/status`).then((r) => asJson<LichessStatus>(r)),
  eventsUrl: (): string => `${BASE}/events-sse`,
  createChallenge: (req: CreateChallengeRequest): Promise<unknown> =>
    fetch(`${BASE}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then(asJson),
  abortGame: (gameId: string): Promise<unknown> =>
    fetch(`${BASE}/games/${encodeURIComponent(gameId)}/abort`, { method: 'POST' }).then(asJson),
  resignGame: (gameId: string): Promise<unknown> =>
    fetch(`${BASE}/games/${encodeURIComponent(gameId)}/resign`, { method: 'POST' }).then(asJson),
};
