import { getWalletStatus, sendTransaction, receiveWinnings, updateWalletBalance } from "./solanaService";
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

// Game wallet address - this wallet is used for both staking and payouts
const STAKING_WALLET = "7pXBHmYenM9JLmJYZbBsb4ZJSQ5DNoGzRyKB61GTRVoo";

// Play a game
export const playGame = async (params: GameParams): Promise<GameResult> => {
  const { gameType, betAmount, prediction } = params;
  
  console.log("[Game] Starting game with params:", params);
  console.log(`[Game] Using staking wallet address: ${STAKING_WALLET}`);
  
  // Validate bet amount
  if (betAmount < MIN_BET) {
    throw new Error(`Minimum bet amount is ${MIN_BET} SOL`);
  }
  
  if (betAmount > MAX_BET) {
    throw new Error(`Maximum bet amount is ${MAX_BET} SOL`);
  }

  // Get wallet status and update balance
  await updateWalletBalance();
  const wallet = getWalletStatus();
  console.log(`[Game] Current wallet status: Address=${wallet.address}, Balance=${wallet.balance} SOL`);
  
  if (!wallet.connected) {
    toast.error("Wallet not connected", {
      description: "Please connect your Phantom wallet to play"
    });
    throw new Error("Wallet not connected");
  }
  
  if (wallet.balance < betAmount) {
    toast.error("Insufficient balance", {
      description: `You need at least ${betAmount} SOL to place this bet`
    });
    throw new Error("Insufficient balance");
  }
  
  // Validate prediction based on game type
  if (gameType === "coinflip" && (prediction !== 0 && prediction !== 1)) {
    throw new Error("Invalid prediction for coinflip. Must be 0 (tails) or 1 (heads)");
  }
  
  if (gameType === "dice" && (prediction < 1 || prediction > 6)) {
    throw new Error("Invalid prediction for dice. Must be between 1 and 6");
  }
  
  console.log("[Game] Game validation passed, proceeding with game");
  
  try {
    // Send transaction to blockchain (this will open Phantom wallet popup)
    console.log(`[Game] Sending ${betAmount} SOL from ${wallet.address} to staking wallet ${STAKING_WALLET}`);
    toast.loading("Waiting for transaction confirmation...", {
      id: "transaction-pending"
    });
    
    // This will trigger the Phantom wallet popup for transaction approval
    // Send the stake to the staking wallet address
    const txSignature = await sendTransaction(betAmount, STAKING_WALLET);
    console.log("[Game] Stake transaction confirmed with signature:", txSignature);
    
    toast.success("Transaction confirmed", {
      id: "transaction-pending",
      description: "Processing game outcome..."
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
    
    // Update balance after staking
    await updateWalletBalance();
    console.log(`[Game] Updated wallet balance after staking: ${getWalletStatus().balance} SOL`);
    
    // Generate random outcome using a verifiable random function
    // For a real implementation, this would use Chainlink VRF or similar
    let outcome: number;
    
    // Use a cryptographically secure random number generator
    // This is a simplified version for the demo
    const randomBuffer = new Uint8Array(1);
    window.crypto.getRandomValues(randomBuffer);
    
    if (gameType === "coinflip") {
      outcome = randomBuffer[0] % 2; // 0 or 1
    } else {
      outcome = (randomBuffer[0] % 6) + 1; // 1-6
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
    
    console.log("[Game] Game result:", result);
    
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
      console.log(`[Game] Player won ${payout} SOL, sending from staking wallet ${STAKING_WALLET} to user wallet ${wallet.address}...`);
      
      toast.loading("Processing winnings...", {
        id: "payout-pending"
      });
      
      try {
        // In a real blockchain application, this would be handled by the smart contract
        // automatically based on the game outcome. Here we're simulating that process.
        await receiveWinnings(payout, STAKING_WALLET);
        
        // Update balance after receiving winnings
        await updateWalletBalance();
        console.log(`[Game] Updated wallet balance after win: ${getWalletStatus().balance} SOL`);
        
        toast.success(`You won ${payout.toFixed(4)} SOL!`, {
          id: "payout-pending",
          description: "Winnings have been sent to your wallet"
        });
      } catch (error) {
        console.error("[Game] Failed to process winnings:", error);
        toast.error("Failed to process winnings", {
          id: "payout-pending",
          description: "Please check your wallet balance manually"
        });
      }
    } else {
      toast.error("Better luck next time!", {
        description: `The outcome was ${gameType === "coinflip" ? (outcome === 0 ? "tails" : "heads") : outcome}`
      });
    }
    
    // Calculate win rate
    gameStats.winRate = (gameStats.wins / gameStats.totalGames) * 100;
    
    // Update wallet balance after game
    await updateWalletBalance();
    const updatedWallet = getWalletStatus();
    console.log(`[Game] Final wallet balance: ${updatedWallet.balance} SOL`);
    
    return result;
  } catch (error) {
    console.error("[Game] Transaction error:", error);
    toast.error("Transaction failed", {
      description: "The transaction was rejected or failed. Please try again."
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
