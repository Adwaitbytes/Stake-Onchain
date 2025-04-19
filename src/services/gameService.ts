
import { GameResult, GameStats } from "@/types/games";
import { 
  playCoinFlip, 
  playDiceRoll, 
  getUserGameHistory as getBlockchainGameHistory,
  getUserGameStats as getBlockchainGameStats
} from "./arbitrumService";

// Play a game
export const playGame = async (
  gameType: 'coinflip' | 'dice',
  stake: number,
  playerChoice: string
): Promise<GameResult> => {
  try {
    if (gameType === 'coinflip') {
      if (playerChoice !== 'heads' && playerChoice !== 'tails') {
        throw new Error('Invalid choice for coin flip. Must be "heads" or "tails"');
      }
      return await playCoinFlip(stake, playerChoice as 'heads' | 'tails');
    } else if (gameType === 'dice') {
      return await playDiceRoll(stake, playerChoice);
    } else {
      throw new Error('Unsupported game type');
    }
  } catch (error) {
    console.error(`Failed to play ${gameType} game:`, error);
    throw error;
  }
};

// Get game history for a user
export const getUserGameHistory = async (gameType?: 'coinflip' | 'dice'): Promise<GameResult[]> => {
  try {
    return await getBlockchainGameHistory(gameType);
  } catch (error) {
    console.error('Failed to get game history:', error);
    return [];
  }
};

// Get game statistics for a user
export const getUserGameStats = async (gameType?: 'coinflip' | 'dice'): Promise<GameStats> => {
  try {
    return await getBlockchainGameStats(gameType);
  } catch (error) {
    console.error('Failed to get game stats:', error);
    return {
      totalGames: 0,
      totalWagered: 0,
      totalPayout: 0,
      winRate: 0
    };
  }
};
