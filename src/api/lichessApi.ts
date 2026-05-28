import type { LichessStatus } from '../types/lichess';

const BASE = '/api/lichess';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export const lichessApi = {
  status: (): Promise<LichessStatus> => fetch(`${BASE}/status`).then((r) => asJson<LichessStatus>(r)),
  eventsUrl: (): string => `${BASE}/events-sse`,
};
