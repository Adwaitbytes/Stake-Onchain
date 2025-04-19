
import { getWalletStatus, sendTransaction, receiveWinnings } from "./arbitrumService";
import { GameType, GameResult, GameStats } from "@/types/games";
import { toast } from "sonner";

// Game parameters
interface GameParams {
  gameType: GameType;
  betAmount: number;
  prediction: number; // 0 or 1 for coinflip (tails/heads), 1-6 for dice
}

// Mock data for game results
let gameHistory: GameResult[] = [];
let gameStats: GameStats = {
  totalGames: 0,
  totalWagered: 0,
  totalPayout: 0,
  wins: 0,
  winRate: 0
};

// Constants
const COIN_FLIP_MULTIPLIER = 1.95; // 1.95x payout for coinflip
const DICE_MULTIPLIER = 5.7;       // 5.7x payout for dice roll (6x minus house edge)
const MIN_BET = 0.001;             // Minimum bet amount
const MAX_BET = 5;                 // Maximum bet amount

// Game contract address - this is the official address that will receive bets
const GAME_CONTRACT_ADDRESS = "0xa4FA024Fac779dBc7B99F146De68bFf4a8c7bb32";
// User wallet address - this is your main wallet that will place bets
const USER_WALLET_ADDRESS = "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C";

// Play a game
export const playGame = async (params: GameParams): Promise<GameResult> => {
  const { gameType, betAmount, prediction } = params;
  
  console.log("Play game with params:", params);
  
  // Validate bet amount
  if (betAmount < MIN_BET) {
    toast.error(`Minimum bet amount is ${MIN_BET} ETH`);
    throw new Error(`Minimum bet amount is ${MIN_BET} ETH`);
  }
  
  if (betAmount > MAX_BET) {
    toast.error(`Maximum bet amount is ${MAX_BET} ETH`);
    throw new Error(`Maximum bet amount is ${MAX_BET} ETH`);
  }

  // Get wallet status
  const wallet = getWalletStatus();
  if (!wallet.connected) {
    toast.error("Wallet not connected", {
      description: "Please connect your wallet to play"
    });
    throw new Error("Wallet not connected");
  }
  
  if (wallet.balance < betAmount) {
    toast.error("Insufficient balance", {
      description: `You need at least ${betAmount} ETH to place this bet`
    });
    throw new Error("Insufficient balance");
  }
  
  // Validate prediction based on game type
  if (gameType === "coinflip" && (prediction !== 0 && prediction !== 1)) {
    toast.error("Invalid prediction for coinflip", {
      description: "Must be 0 (tails) or 1 (heads)"
    });
    throw new Error("Invalid prediction for coinflip. Must be 0 (tails) or 1 (heads)");
  }
  
  if (gameType === "dice" && (prediction < 1 || prediction > 6)) {
    toast.error("Invalid prediction for dice", {
      description: "Must be between 1 and 6"
    });
    throw new Error("Invalid prediction for dice. Must be between 1 and 6");
  }
  
  console.log("Game validation passed, proceeding with game");
  
  try {
    // Send transaction to blockchain (this will open MetaMask popup)
    console.log(`Sending ${betAmount} ETH from ${USER_WALLET_ADDRESS} to game contract ${GAME_CONTRACT_ADDRESS}`);
    
    toast.info("Transaction initiated", {
      description: "Confirm the transaction in your wallet"
    });
    
    // This will trigger the MetaMask popup for transaction approval
    const txHash = await sendTransaction(betAmount);
    console.log("Transaction confirmed with hash:", txHash);
    
    toast.success("Bet placed successfully", {
      description: "Transaction confirmed"
    });
    
    // In a real blockchain app, we would wait for the transaction confirmation
    // Here we're simulating a short delay to represent blockchain confirmation time
    const transactionPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
    
    // Wait for transaction to complete
    await transactionPromise;
    
    // Generate random outcome
    let outcome: number;
    if (gameType === "coinflip") {
      outcome = Math.floor(Math.random() * 2); // 0 or 1
    } else {
      outcome = Math.floor(Math.random() * 6) + 1; // 1-6
    }
    
    // Determine if player won
    const won = prediction === outcome;
    
    // Calculate payout
    const multiplier = gameType === "coinflip" ? COIN_FLIP_MULTIPLIER : DICE_MULTIPLIER;
    const payout = won ? betAmount * multiplier : 0;
    
    // Create game result
    const result: GameResult = {
      id: Date.now().toString(),
      player: wallet.address,
      gameType,
      stake: betAmount,
      prediction,
      outcome,
      payout,
      won,
      timestamp: Date.now()
    };
    
    console.log("Game result:", result);
    
    // Add to history
    gameHistory.unshift(result);
    
    // Update stats
    gameStats.totalGames += 1;
    gameStats.totalWagered += betAmount;
    
    // If won, add winnings to wallet balance and trigger payout
    if (won) {
      gameStats.wins += 1;
      gameStats.totalPayout += payout;
      
      // Explicitly receive winnings - this simulates the smart contract sending funds back
      console.log(`Player won ${payout} ETH, sending from game contract ${GAME_CONTRACT_ADDRESS} to user wallet ${USER_WALLET_ADDRESS}...`);
      
      toast.success(`You won ${payout.toFixed(4)} ETH!`, {
        description: "Winnings are being sent to your wallet"
      });
      
      // In a real blockchain application, this would be handled by the smart contract
      // automatically based on the game outcome. Here we're simulating that process.
      await receiveWinnings(payout);
    } else {
      toast.error("Better luck next time!", {
        description: `The outcome was ${gameType === "coinflip" ? (outcome === 0 ? "tails" : "heads") : outcome}`
      });
    }
    
    // Calculate win rate
    gameStats.winRate = (gameStats.wins / gameStats.totalGames) * 100;
    
    return result;
  } catch (error) {
    console.error("Transaction error:", error);
    toast.error("Transaction failed", {
      description: "Please try again or check your wallet connection"
    });
    throw new Error("Transaction was rejected or failed. Please try again.");
  }
};

// Get user's game history
export const getUserGameHistory = async (gameType?: GameType): Promise<GameResult[]> => {
  // In a real app, this would fetch from the blockchain
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  
  if (gameType) {
    return gameHistory.filter(game => game.gameType === gameType);
  }
  
  return gameHistory;
};

// Get user's game stats
export const getUserGameStats = async (): Promise<GameStats> => {
  // In a real app, this would fetch from the blockchain
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
  
  return gameStats;
};
