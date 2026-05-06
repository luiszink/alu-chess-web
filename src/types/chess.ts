export type Color = 'White' | 'Black';
export type PieceType = 'King' | 'Queen' | 'Rook' | 'Bishop' | 'Knight' | 'Pawn';
export type GameStatusType = 'Playing' | 'Check' | 'Checkmate' | 'Stalemate' | 'Resigned' | 'Draw' | 'TimeOut';

export interface GameJson {
  fen: string;
  status: GameStatusType;
  currentPlayer: Color;
  halfMoveClock: number;
  fullMoveNumber: number;
  isTerminal: boolean;
}

export interface ClockState {
  whiteTimeMs: number;
  blackTimeMs: number;
}

export interface ControllerState {
  game: GameJson;
  browseIndex: number;
  totalStates: number;
  isAtLatest: boolean;
  isInReplay: boolean;
  statusText: string;
  clock: ClockState | null;
}

export interface MoveHistoryEntry {
  move: string;
  san: string;
  status: GameStatusType;
}

export interface PieceInfo {
  type: PieceType;
  color: Color;
  symbol: string;
}

export interface MoveJson {
  from: string;
  to: string;
  promotion: string | null;
}

export interface LegalMoveTarget {
  to: string;
  isCapture: boolean;
  promotion: string | null;
}

export interface LegalMovesForSquare {
  square: string;
  piece: PieceInfo | null;
  moves: LegalMoveTarget[];
}

export interface GameRecordSummary {
  id: string;
  datePlayed: string;
  result: string;
  moveCount: number;
}

export interface TestPosition {
  name: string;
  fen: string;
  description: string;
}

export interface EngineOptions {
  thinkTimeMs: number;
  skillLevel: number;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface BestMoveResponse {
  move: MoveJson;
  uci: string;
  scoreCp: number;
  mate: number | null;
  depth: number;
  nodes: number;
  timeMs: number;
  engine: string;
}

export interface EvaluateResponse {
  scoreCp: number;
  mate: number | null;
  depth: number;
  nodes: number;
  timeMs: number;
  bestMove: MoveJson;
  bestMoveUci: string;
  engine: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// ── PlayerService types ───────────────────────────────────────

export type GameMode = 'HumanVsHuman' | 'HumanVsAI';
export type SessionStatus = 'Waiting' | 'Active' | 'Finished';

export interface PlayerResponse {
  id: string;
  name: string;
  gameId: string | null;
  color: Color | null;
}

export interface GameSessionResponse {
  id: string;
  mode: GameMode;
  whitePlayerId: string;
  blackPlayerId: string | null;
  status: SessionStatus;
}

export interface PlayerStatusResponse {
  player: PlayerResponse;
  session: GameSessionResponse | null;
}
