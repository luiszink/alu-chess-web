import type { AnalyticsSummary } from '../types/analytics';

const BASE = '';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let body: unknown;
    try { body = await r.json(); } catch { body = await r.text(); }
    throw body;
  }
  return r.json();
}

export const analyticsApi = {
  // Vom Controller bedient, der die Spark-Zusammenfassung aus MongoDB liest.
  getSummary: () =>
    fetch(`${BASE}/api/controller/analytics/summary`).then(r => json<AnalyticsSummary>(r)),
};
