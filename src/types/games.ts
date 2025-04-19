
export interface GameResult {
  id: string;
  gameType: 'coinflip' | 'dice';
  playerAddress: string;
  stake: number; // ETH amount
  payout: number; // ETH amount
  outcome: string; // Depends on game type (e.g., "heads", "tails", "1", "2", etc.)
  playerChoice: string; // What the player selected
  won: boolean;
  timestamp: number;
  txHash?: string; // Blockchain transaction hash
}

export interface GameStats {
  totalGames: number;
  totalWagered: number;
  totalPayout: number;
  winRate: number;
}
