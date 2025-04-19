
import { GameResult, GameStats } from "@/types/games";
import { 
  playCoinFlip, 
  playDiceRoll, 
  getUserGameHistory as getBlockchainGameHistory,
  getUserGameStats as getBlockchainGameStats,
  getWalletStatus
} from "./arbitrumService";
import { toast } from "sonner";

// Check if wallet is connected before playing
const checkWalletConnection = async (): Promise<boolean> => {
  const walletStatus = await getWalletStatus();
  if (!walletStatus.connected) {
    toast.error("Please connect your wallet to play");
    return false;
  }
  return true;
};

// Play a game
export const playGame = async (
  gameType: 'coinflip' | 'dice',
  stake: number,
  playerChoice: string
): Promise<GameResult> => {
  try {
    // Check wallet connection first
    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

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
    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      return [];
    }
    
    return await getBlockchainGameHistory(gameType);
  } catch (error) {
    console.error('Failed to get game history:', error);
    return [];
  }
};

// Get game statistics for a user
export const getUserGameStats = async (gameType?: 'coinflip' | 'dice'): Promise<GameStats> => {
  try {
    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      return {
        totalGames: 0,
        totalWagered: 0,
        totalPayout: 0,
        winRate: 0
      };
    }
    
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
