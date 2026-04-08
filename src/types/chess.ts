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

export interface ErrorResponse {
  error: string;
  message: string;
}
