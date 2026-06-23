import type { BotStatus, TournamentList, CreateTournamentRequest, RoundPairings, Standing, AnalyticsExport } from '../types/tournament';

const BASE = '/api/tournament';
const AUTH_BASE = '/api/auth';

/**
 * A JWT has the shape `header.payload.signature` (three base64url parts).
 * The controller now forwards this token straight to the upstream tournament
 * server, which rejects anything malformed with "invalid token format".
 * Guards against stale/garbage cache values such as the literal string
 * `"undefined"` that older code could persist into localStorage.
 */
function looksLikeJwt(t: string | null | undefined): t is string {
  return typeof t === 'string' && t.split('.').length === 3 && t.length > 20;
}

// ── User token (isBot=false) – for create / start ────────────────────────────
let cachedUserToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (looksLikeJwt(cachedUserToken)) return cachedUserToken;
  const stored = localStorage.getItem('tournament_auth_token');
  if (looksLikeJwt(stored)) { cachedUserToken = stored; return stored; }
  // Purge any garbage (e.g. a persisted "undefined") so we re-register cleanly.
  cachedUserToken = null;
  localStorage.removeItem('tournament_auth_token');

  // Use a stable director name stored in localStorage so re-registrations
  // always use the same name (server returns the same id for the same name)
  let directorName = localStorage.getItem('tournament_director_name');
  if (!directorName) {
    directorName = `Director-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('tournament_director_name', directorName);
  }

  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: directorName, isBot: false }),
  });
  if (!res.ok) throw new Error('Failed to register');
  const data = (await res.json()) as { token?: string };
  if (!looksLikeJwt(data.token)) throw new Error('Register did not return a valid token');
  cachedUserToken = data.token;
  localStorage.setItem('tournament_auth_token', data.token);
  return data.token;
}

// ── Bot token (isBot=true) – for join / play ─────────────────────────────────
let cachedBotToken: string | null = null;
let cachedBotId: string | null = null;

export function getMyBotName(): string {
  return localStorage.getItem('my_bot_name') ?? 'MyTeam-Bot';
}

export function setMyBotName(name: string): void {
  localStorage.setItem('my_bot_name', name);
  // Invalidate cached bot token – next join will re-register with the new name
  cachedBotToken = null;
  cachedBotId = null;
  localStorage.removeItem('tournament_bot_token');
  localStorage.removeItem('tournament_bot_id');
}

export async function getMyBotToken(): Promise<{ token: string; id: string }> {
  if (looksLikeJwt(cachedBotToken) && cachedBotId) return { token: cachedBotToken, id: cachedBotId };
  const storedToken = localStorage.getItem('tournament_bot_token');
  const storedId    = localStorage.getItem('tournament_bot_id');
  if (looksLikeJwt(storedToken) && storedId) {
    cachedBotToken = storedToken;
    cachedBotId    = storedId;
    return { token: storedToken, id: storedId };
  }
  // Purge any garbage (e.g. a persisted "undefined") so we re-register cleanly.
  cachedBotToken = null;
  cachedBotId    = null;
  localStorage.removeItem('tournament_bot_token');
  localStorage.removeItem('tournament_bot_id');
  const name = getMyBotName();
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, isBot: true }),
  });
  if (!res.ok) throw new Error('Failed to register bot');
  const data = (await res.json()) as { token?: string; id?: string };
  if (!looksLikeJwt(data.token) || !data.id) throw new Error('Bot register did not return a valid token');
  cachedBotToken = data.token;
  cachedBotId    = data.id;
  localStorage.setItem('tournament_bot_token', data.token);
  localStorage.setItem('tournament_bot_id',    data.id);
  return { token: data.token, id: data.id };
}

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
    fetch(`${BASE}/`).then((r) => asJson<TournamentList>(r)),

  get: (id: string): Promise<unknown> =>
    fetch(`${BASE}/${encodeURIComponent(id)}`).then((r) => asJson(r)),

  create: async (req: CreateTournamentRequest): Promise<{ id?: string }> => {
    const token = await getAuthToken();
    const form = new URLSearchParams();
    form.append('name', req.name);
    form.append('nbRounds', String(req.nbRounds));
    form.append('clockLimit', String(req.clockLimit));
    form.append('clockIncrement', String(req.clockIncrement));
    form.append('format', req.format);
    return fetch(`${BASE}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    }).then((r) => asJson<{ id?: string }>(r));
  },

  connect: async (id: string): Promise<unknown> => {
    const { token } = await getMyBotToken();
    return fetch(`${BASE}/${encodeURIComponent(id)}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(asJson);
  },

  /**
   * Starts the server-side TournamentBot loop for this tournament: it joins,
   * opens the NDJSON event stream and actually plays the games — and is the
   * only thing that moves the bot status from "idle" to "playing".
   */
  connectBot: async (id: string): Promise<unknown> =>
    fetch(`${BASE}/connect/${encodeURIComponent(id)}`, {
      method: 'POST',
    }).then(asJson),

  start: async (id: string): Promise<unknown> => {
    const token = await getAuthToken();
    return fetch(`${BASE}/${encodeURIComponent(id)}/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(asJson);
  },

  join: async (id: string): Promise<unknown> => {
    const { token } = await getMyBotToken();
    return fetch(`${BASE}/${encodeURIComponent(id)}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(asJson);
  },

  withdraw: async (id: string): Promise<unknown> => {
    const { token } = await getMyBotToken();
    return fetch(`${BASE}/${encodeURIComponent(id)}/withdraw`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(asJson);
  },

  roundPairings: async (id: string, round: number): Promise<RoundPairings> => {
    const raw = await fetch(`${BASE}/${encodeURIComponent(id)}/round/${round}`).then((r) => asJson<any>(r));
    // API returns matches[].gameId/outcome — normalize to top-level gameId/winner
    return {
      round: raw.round,
      pairings: (raw.pairings ?? []).map((p: any) => {
        const firstMatch = p.matches?.[0];
        return {
          white: p.white,
          black: p.black,
          gameId: firstMatch?.gameId ?? p.gameId,
          winner: firstMatch?.outcome ?? p.winner ?? null,
          matchResults: (p.matches ?? []).map((m: any) => ({
            gameId: m.gameId,
            winner: m.outcome ?? null,
          })),
        };
      }),
    };
  },

  /** Fetches NDJSON results and parses them into Standing objects. */
  results: async (id: string): Promise<Standing[]> => {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/results`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Standing);
  },

  analyticsExport: (id: string): Promise<AnalyticsExport> =>
    fetch(`${BASE}/${encodeURIComponent(id)}/analytics-export`).then((r) => asJson<AnalyticsExport>(r)),

  /** Returns a URL for the raw NDJSON game stream (used with fetch/ReadableStream). */
  gameStreamUrl: (tournamentId: string, gameId: string): string =>
    `${BASE}/${encodeURIComponent(tournamentId)}/game/${encodeURIComponent(gameId)}/stream`,

  /** Fetches a game stream with authentication headers */
  getGameStream: async (tournamentId: string, gameId: string, signal?: AbortSignal): Promise<Response> => {
    const token = await getAuthToken();
    return fetch(`${BASE}/${encodeURIComponent(tournamentId)}/game/${encodeURIComponent(gameId)}/stream`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal,
    });
  },

  logsUrl: (): string => `${BASE}/logs`,
};
