
// Game types
export type GameType = "coinflip" | "dice";

// Game result interface
export interface GameResult {
  id: string;
  player: string;
  gameType: GameType;
  stake: number;
  prediction: number;
  outcome: number;
  payout: number;
  won: boolean;
  timestamp: number;
}

// Game stats interface
export interface GameStats {
  totalGames: number;
  totalWagered: number;
  totalPayout: number;
  wins: number;
  winRate: number;
}
