
import { GameResult, GameStats } from "@/types/games";
import { getWalletStatus } from "./mockBlockchainService";

// Storage keys
const GAME_RESULTS_KEY = 'aipredict_game_results';

// Initialize storage
const initStorage = () => {
  if (!localStorage.getItem(GAME_RESULTS_KEY)) {
    localStorage.setItem(GAME_RESULTS_KEY, JSON.stringify([]));
  }
};

// Generate provably fair random result based on multiple inputs
const getProvablyFairResult = (
  gameId: string,
  playerInput: string,
  gameType: 'coinflip' | 'dice'
): { outcome: string; won: boolean; } => {
  // In a real implementation, this would use blockchain-based randomness
  // or cryptographic proofs to ensure fairness
  
  // Create a seed from multiple sources to simulate provable fairness
  const timestampSeed = Date.now();
  const playerSeed = playerInput.length; 
  const idSeed = gameId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Combine seeds
  const combinedSeed = (timestampSeed + playerSeed + idSeed) % 1000;
  
  // Generate result based on game type
  if (gameType === 'coinflip') {
    const result = combinedSeed % 2 === 0 ? 'heads' : 'tails';
    const won = result === playerInput;
    return { outcome: result, won };
  } else if (gameType === 'dice') {
    // Roll a dice (1-6)
    const roll = (combinedSeed % 6) + 1;
    // Player wins if they correctly guessed the roll
    const won = roll.toString() === playerInput;
    return { outcome: roll.toString(), won };
  }
  
  // Fallback
  return { outcome: 'error', won: false };
};

// Play a game
export const playGame = async (
  gameType: 'coinflip' | 'dice',
  stake: number,
  playerChoice: string
): Promise<GameResult> => {
  initStorage();
  
  const wallet = getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  if (wallet.balance < stake) throw new Error('Insufficient balance');
  
  // Generate unique game ID
  const gameId = `game_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Get game result
  const { outcome, won } = getProvablyFairResult(gameId, playerChoice, gameType);
  
  // Calculate payout based on game type and result
  let payout = 0;
  if (won) {
    if (gameType === 'coinflip') {
      // 1.95x payout for coinflip (accounting for 2.5% house edge)
      payout = stake * 1.95;
    } else if (gameType === 'dice') {
      // 5.7x payout for correctly guessing dice (accounting for house edge)
      payout = stake * 5.7;
    }
  }
  
  // Create game result record
  const gameResult: GameResult = {
    id: gameId,
    gameType,
    playerAddress: wallet.address,
    stake,
    payout,
    outcome,
    playerChoice,
    won,
    timestamp: Date.now(),
    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
  };
  
  // Save result to storage
  const results: GameResult[] = JSON.parse(localStorage.getItem(GAME_RESULTS_KEY) || '[]');
  results.push(gameResult);
  localStorage.setItem(GAME_RESULTS_KEY, JSON.stringify(results));
  
  // Update wallet balance
  wallet.balance = Math.max(0, wallet.balance - stake);
  if (won) {
    wallet.balance += payout;
  }
  localStorage.setItem('aipredict_wallet', JSON.stringify(wallet));
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return gameResult;
};

// Get game history for a user
export const getUserGameHistory = async (gameType?: 'coinflip' | 'dice'): Promise<GameResult[]> => {
  initStorage();
  
  const wallet = getWalletStatus();
  if (!wallet.connected) return [];
  
  const results: GameResult[] = JSON.parse(localStorage.getItem(GAME_RESULTS_KEY) || '[]');
  
  return results
    .filter(result => 
      result.playerAddress === wallet.address && 
      (gameType ? result.gameType === gameType : true)
    )
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first
};

// Get game statistics for a user
export const getUserGameStats = async (gameType?: 'coinflip' | 'dice'): Promise<GameStats> => {
  const history = await getUserGameHistory(gameType);
  
  if (history.length === 0) {
    return {
      totalGames: 0,
      totalWagered: 0,
      totalPayout: 0,
      winRate: 0
    };
  }
  
  const totalGames = history.length;
  const totalWagered = history.reduce((sum, game) => sum + game.stake, 0);
  const totalPayout = history.reduce((sum, game) => sum + game.payout, 0);
  const wins = history.filter(game => game.won).length;
  const winRate = (wins / totalGames) * 100;
  
  return {
    totalGames,
    totalWagered,
    totalPayout,
    winRate
  };
};
