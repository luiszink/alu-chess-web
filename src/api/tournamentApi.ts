import type { BotStatus, TournamentList, CreateTournamentRequest } from '../types/tournament';

const BASE = '/api/tournament';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = (j && (j.detail || j.message || j.error)) || '';
    } catch {
      /* ignore */
    }
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const tournamentApi = {
  status: (): Promise<BotStatus> =>
    fetch(`${BASE}/status`).then((r) => asJson<BotStatus>(r)),

  list: (): Promise<TournamentList> =>
    fetch(`${BASE}/list`).then((r) => asJson<TournamentList>(r)),

  create: (req: CreateTournamentRequest): Promise<{ id?: string }> =>
    fetch(`${BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then((r) => asJson<{ id?: string }>(r)),

  connect: (id: string): Promise<unknown> =>
    fetch(`${BASE}/connect/${encodeURIComponent(id)}`, { method: 'POST' }).then(asJson),

  start: (id: string): Promise<unknown> =>
    fetch(`${BASE}/start/${encodeURIComponent(id)}`, { method: 'POST' }).then(asJson),

  logsUrl: (): string => `${BASE}/logs`,
};
