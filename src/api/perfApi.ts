import type {
  BenchmarkConfig,
  BenchmarkResult,
  CompareResponse,
  DaoListResponse,
  RunsListResponse,
} from '../types/perf';

const BASE = '';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let body: unknown;
    try { body = await r.json(); } catch { body = await r.text(); }
    throw body;
  }
  return r.json();
}

function get<T>(path: string): Promise<T> {
  return fetch(`${BASE}${path}`).then(r => json<T>(r));
}

function post<T>(path: string, body?: object): Promise<T> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => json<T>(r));
}

export const perfApi = {
  listDaos: () => get<DaoListResponse>('/api/perf/dao/list'),

  benchmark: (dao: string, config: BenchmarkConfig) =>
    post<BenchmarkResult>(`/api/perf/dao/${dao}/benchmark`, config),

  compare: (daos: string[], config: BenchmarkConfig) =>
    post<CompareResponse>('/api/perf/dao/compare', { daos, config }),

  listRuns: (limit = 50) =>
    get<RunsListResponse>(`/api/perf/runs?limit=${limit}`),

  getRun: (id: string) => get<BenchmarkResult>(`/api/perf/runs/${id}`),
};
