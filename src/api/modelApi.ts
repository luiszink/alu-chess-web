import type {
  GameJson,
  LegalMovesForSquare,
  MoveJson,
  ErrorResponse,
  TestPosition,
  EngineOptions,
  HealthResponse,
  BestMoveResponse,
  EvaluateResponse,
} from '../types/chess';

const MODEL_URL = '';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const err: ErrorResponse = await r.json();
    throw err;
  }
  return r.json();
}

function post<T>(path: string, body: object): Promise<T> {
  return fetch(`${MODEL_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => json<T>(r));
}

export const modelApi = {
  getStockfishHealth: () =>
    fetch(`${MODEL_URL}/api/model/stockfish/health`).then(r => json<HealthResponse>(r)),
  getBestMove: (fen: string, options: EngineOptions) =>
    post<BestMoveResponse>('/api/model/stockfish/best-move', { fen, ...options }),
  evaluatePosition: (fen: string, options: EngineOptions) =>
    post<EvaluateResponse>('/api/model/stockfish/evaluate', { fen, ...options }),
  newGame: () =>
    fetch(`${MODEL_URL}/api/model/new-game`).then(r => json<GameJson>(r)),
  validateMove: (fen: string, from: string, to: string, promotion?: string) =>
    post<GameJson>('/api/model/validate-move', { fen, from, to, promotion: promotion ?? null }),
  legalMoves: (fen: string) =>
    post<{ moves: MoveJson[] }>('/api/model/legal-moves', { fen }),
  legalMovesForSquare: (fen: string, square: string) =>
    post<LegalMovesForSquare>('/api/model/legal-moves-for-square', { fen, square }),
  parseFen: (fen: string) =>
    post<GameJson>('/api/model/parse-fen', { fen }),
  toFen: (game: GameJson) =>
    post<{ fen: string }>('/api/model/to-fen', game),
  parsePgn: (pgn: string) =>
    post<GameJson>('/api/model/parse-pgn', { pgn }),
  toPgn: (game: GameJson) =>
    post<{ pgn: string }>('/api/model/to-pgn', game),
  getTestPositions: () =>
    fetch(`${MODEL_URL}/api/model/test-positions`).then(r => json<{ positions: TestPosition[] }>(r)),
};
