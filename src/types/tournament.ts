export interface TournamentInfo {
  id: string;
  fullName: string;
  status: string;
  nbPlayers: number;
  nbRounds: number;
  format: string;
  createdBy?: string;
  canStart?: boolean;
  // Aliases for display
  name?: string;
  players?: number;
}

export interface TournamentList {
  created: TournamentInfo[];
  started: TournamentInfo[];
  finished: TournamentInfo[];
}

export type BotStatusType = 'idle' | 'playing' | 'error';

export interface BotStatus {
  status: BotStatusType;
  tournamentId?: string;
  round?: number;
  gamesActive?: number;
  message?: string;
}

export interface CreateTournamentRequest {
  name: string;
  nbRounds: number;
  clockLimit: number;
  clockIncrement: number;
  format: string;
}

// ── Detail view ──────────────────────────────────────────────────────────────

export interface BotRef {
  id: string;
  name: string;
}

export interface PairingResult {
  gameId: string;
  winner: 'white' | 'black' | 'draw' | null;
}

export interface Pairing {
  round: number;
  white: BotRef;
  black: BotRef;
  gameId?: string;
  matchesPerPairing?: number;
  matchResults?: PairingResult[];
  winner?: 'white' | 'black' | 'draw' | null;
}

export interface RoundPairings {
  round: number;
  pairings: Pairing[];
}

export interface Standing {
  rank: number;
  points: number;
  tieBreak?: number;
  bot: BotRef;
  nbGames?: number;
  wins?: number;
  draws?: number;
  losses?: number;
}

// ── Analytics Export ─────────────────────────────────────────────────────────

export interface AnalyticsExportGame {
  gameId: string;
  tournamentId: string;
  round: number;
  whiteBotId: string;
  whiteBotName: string;
  blackBotId: string;
  blackBotName: string;
  winner: 'white' | 'black' | 'draw' | null;
  winnerBotId: string | null;
  terminationReason: string;
  totalPly: number;
  moves: string;
  startedAt?: string;
  endedAt?: string;
  durationMillis?: number;
}

export interface AnalyticsExportStanding {
  tournamentId: string;
  botId: string;
  botName: string;
  botFamily?: string;
  strategyType?: string;
  engineType?: string;
  modelVersion?: string;
  rank: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  nbGames: number;
  tieBreak: number;
}

export interface AnalyticsExport {
  schemaVersion: string;
  tournamentId: string;
  format: string;
  clock: { limit: number; increment: number };
  rated: boolean;
  nbRounds: number;
  startedAt?: string;
  finishedAt?: string;
  exportedAt: string;
  standings: AnalyticsExportStanding[];
  games: AnalyticsExportGame[];
}
