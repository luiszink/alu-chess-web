export interface TournamentInfo {
  id: string;
  name: string;
  status: string;
  players: number;
  rounds: number;
  format: string;
  createdBy?: string;
  canStart?: boolean;
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
