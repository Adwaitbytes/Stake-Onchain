
import { ethers } from "ethers";
import { GameResult, GameStats } from "@/types/games";

// Constants
export const ARBITRUM_CHAIN_ID = 42161; // Mainnet
export const ARBITRUM_STYLUS_TESTNET_CHAIN_ID = 23011913; // Stylus Testnet

// Game contract ABI (simplified for example)
// In a real implementation, you would import the full ABI from a generated file
const GAME_CONTRACT_ABI = [
  "function playCoinFlip(bool isHeads) payable returns (bool won, uint256 payout)",
  "function playDiceRoll(uint8 prediction) payable returns (uint8 outcome, bool won, uint256 payout)",
  "function getPlayerStats(address player) view returns (uint256 totalGames, uint256 totalWagered, uint256 totalPayout, uint256 wins)"
];

// Contract addresses - in production you would use the deployed contract addresses
export const GAME_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual contract address

// Provider & Signer
let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let gameContract: ethers.Contract | null = null;

// Initialize blockchain connection
export const initBlockchain = async (): Promise<boolean> => {
  try {
    // Check if ethereum object exists (MetaMask, etc.)
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to use this application.");
    }
    
    // Create provider
    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await provider.send("eth_requestAccounts", []);
    
    if (accounts.length > 0) {
      // Get signer
      signer = await provider.getSigner();
      
      // Initialize game contract
      gameContract = new ethers.Contract(
        GAME_CONTRACT_ADDRESS,
        GAME_CONTRACT_ABI,
        signer
      );
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to initialize blockchain:", error);
    throw error;
  }
};

// Connect wallet
export const connectWallet = async (): Promise<{ address: string; balance: number }> => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to use this application.");
    }
    
    const initialized = await initBlockchain();
    if (!initialized) {
      throw new Error("Failed to initialize blockchain connection");
    }
    
    if (!signer) {
      if (!provider) {
        provider = new ethers.BrowserProvider(window.ethereum);
      }
      signer = await provider.getSigner();
    }
    
    const address = await signer.getAddress();
    const balanceWei = await provider.getBalance(address);
    const balance = parseFloat(ethers.formatEther(balanceWei));
    
    // Switch to Arbitrum if not already on it
    await switchToArbitrum();
    
    return { address, balance };
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
};

// Disconnect wallet
export const disconnectWallet = async (): Promise<void> => {
  provider = null;
  signer = null;
  gameContract = null;
};

// Get wallet status
export const getWalletStatus = async (): Promise<{ connected: boolean; address: string; balance: number }> => {
  try {
    if (!provider || !signer) {
      return { connected: false, address: "", balance: 0 };
    }
    
    const address = await signer.getAddress();
    const balanceWei = await provider.getBalance(address);
    const balance = parseFloat(ethers.formatEther(balanceWei));
    
    return { connected: true, address, balance };
  } catch (error) {
    console.error("Failed to get wallet status:", error);
    return { connected: false, address: "", balance: 0 };
  }
};

// Switch to Arbitrum network
export const switchToArbitrum = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) return false;
    
    try {
      // Try to switch to Arbitrum
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }]
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}`,
              chainName: "Arbitrum One",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: ["https://arb1.arbitrum.io/rpc"],
              blockExplorerUrls: ["https://arbiscan.io/"]
            }
          ]
        });
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("Failed to switch network:", error);
    return false;
  }
};

// Play coin flip game
export const playCoinFlip = async (
  stake: number,
  prediction: "heads" | "tails"
): Promise<GameResult> => {
  try {
    if (!gameContract || !signer) {
      throw new Error("Wallet not connected");
    }
    
    const isHeads = prediction === "heads";
    const stakeWei = ethers.parseEther(stake.toString());
    
    // Call contract method
    const tx = await gameContract.playCoinFlip(isHeads, { value: stakeWei });
    const receipt = await tx.wait();
    
    // Parse events from the transaction receipt to get the result
    // In a real implementation, you would parse specific events from your contract
    // This is simplified for the example
    const event = receipt.logs[0];
    const won = event.args[0];
    const payoutWei = event.args[1];
    const outcome = won ? prediction : (prediction === "heads" ? "tails" : "heads");
    const payout = won ? parseFloat(ethers.formatEther(payoutWei)) : 0;
    
    // Create the game result
    const result: GameResult = {
      id: tx.hash,
      gameType: "coinflip",
      playerAddress: await signer.getAddress(),
      stake,
      payout,
      outcome,
      playerChoice: prediction,
      won,
      timestamp: Date.now(),
      txHash: tx.hash
    };
    
    // Store in local storage for history tracking
    storeGameResult(result);
    
    return result;
  } catch (error) {
    console.error("Failed to play coin flip:", error);
    throw error;
  }
};

// Play dice game
export const playDiceRoll = async (
  stake: number,
  prediction: string
): Promise<GameResult> => {
  try {
    if (!gameContract || !signer) {
      throw new Error("Wallet not connected");
    }
    
    const predictionNumber = parseInt(prediction);
    if (isNaN(predictionNumber) || predictionNumber < 1 || predictionNumber > 6) {
      throw new Error("Invalid prediction");
    }
    
    const stakeWei = ethers.parseEther(stake.toString());
    
    // Call contract method
    const tx = await gameContract.playDiceRoll(predictionNumber, { value: stakeWei });
    const receipt = await tx.wait();
    
    // Parse events to get results (simplified)
    const event = receipt.logs[0];
    const outcome = event.args[0].toString();
    const won = event.args[1];
    const payoutWei = event.args[2];
    const payout = won ? parseFloat(ethers.formatEther(payoutWei)) : 0;
    
    // Create the game result
    const result: GameResult = {
      id: tx.hash,
      gameType: "dice",
      playerAddress: await signer.getAddress(),
      stake,
      payout,
      outcome,
      playerChoice: prediction,
      won,
      timestamp: Date.now(),
      txHash: tx.hash
    };
    
    // Store in local storage for history tracking
    storeGameResult(result);
    
    return result;
  } catch (error) {
    console.error("Failed to play dice game:", error);
    throw error;
  }
};

// Store game result in local storage for history
const storeGameResult = (result: GameResult): void => {
  const GAME_RESULTS_KEY = 'aipredict_game_results';
  const results: GameResult[] = JSON.parse(localStorage.getItem(GAME_RESULTS_KEY) || '[]');
  results.push(result);
  localStorage.setItem(GAME_RESULTS_KEY, JSON.stringify(results));
};

// Get player's game history
export const getUserGameHistory = async (gameType?: 'coinflip' | 'dice'): Promise<GameResult[]> => {
  try {
    if (!signer) {
      return [];
    }
    
    const address = await signer.getAddress();
    
    // For now, we'll use localStorage for history, but in a production app
    // you might want to fetch this from a subgraph or indexer
    const GAME_RESULTS_KEY = 'aipredict_game_results';
    const results: GameResult[] = JSON.parse(localStorage.getItem(GAME_RESULTS_KEY) || '[]');
    
    return results
      .filter(result => 
        result.playerAddress.toLowerCase() === address.toLowerCase() && 
        (gameType ? result.gameType === gameType : true)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to get game history:", error);
    return [];
  }
};

// Get player's game stats
export const getUserGameStats = async (gameType?: 'coinflip' | 'dice'): Promise<GameStats> => {
  try {
    if (!gameContract || !signer) {
      return {
        totalGames: 0,
        totalWagered: 0,
        totalPayout: 0,
        winRate: 0
      };
    }
    
    const address = await signer.getAddress();
    
    // In a real implementation, this would call the contract
    // For now, we'll calculate from local history
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
  } catch (error) {
    console.error("Failed to get game stats:", error);
    return {
      totalGames: 0,
      totalWagered: 0,
      totalPayout: 0,
      winRate: 0
    };
  }
};
