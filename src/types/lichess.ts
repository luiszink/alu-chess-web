// Subset of Lichess Bot-API events the UI cares about, after the backend
// has filtered out auth-sensitive bits and normalised the shapes.

export type LichessChallenge = {
  id: string;
  url?: string;
  status?: string;
  rated: boolean;
  variant: { key: string; name?: string };
  timeControl: { type: string; limit?: number; increment?: number };
  challenger?: { id?: string; name?: string; rating?: number };
  speed?: string;
};

export type LichessPolicy = {
  autoAccept: boolean;
  acceptRated: boolean;
  variants: string[];
  minInitialSeconds: number;
  maxInitialSeconds: number;
  maxGames: number;
};

export type LichessStatus =
  | {
      configured: true;
      username: string;
      games: string[];
      challenges: LichessChallenge[];
      policy: LichessPolicy;
    }
  | {
      configured: false;
      message: string;
      policy: LichessPolicy;
    };

export type LichessGameState = {
  moves: string;
  wtime?: number;
  btime?: number;
  winc?: number;
  binc?: number;
  status: string;
  winner?: string;
};

export type LichessEvent =
  | { type: 'connected'; username: string }
  | { type: 'challenge'; challenge: LichessChallenge }
  | { type: 'challengeCanceled'; id: string }
  | { type: 'challengeDeclined'; id: string }
  | { type: 'accepted'; id: string }
  | { type: 'declined'; id: string; reason: string }
  | { type: 'gameStart'; id: string }
  | { type: 'gameFinish'; id: string }
  | { type: 'gameFull'; gameId: string; state: LichessGameState }
  | { type: 'gameState'; gameId: string; state: LichessGameState }
  | { type: 'myMove'; gameId: string; uci: string }
  | { type: 'error'; gameId?: string; stage?: string; message: string };
