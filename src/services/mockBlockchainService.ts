import { Market, UserBet } from "../types/market";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Mock localStorage-based blockchain service for demo purposes
// In a real app, this would interact with Arbitrum Stylus contracts

// Storage keys
const MARKETS_KEY = 'aipredict_markets';
const BETS_KEY = 'aipredict_bets';
const WALLET_KEY = 'aipredict_wallet';

// Initialize Solana connection with devnet for testing
const connection = new Connection(clusterApiUrl('devnet'), {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  wsEndpoint: 'wss://api.devnet.solana.com/'
});

// Initialize mock storage
const initStorage = () => {
  if (!localStorage.getItem(MARKETS_KEY)) {
    localStorage.setItem(MARKETS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(BETS_KEY)) {
    localStorage.setItem(BETS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(WALLET_KEY)) {
    localStorage.setItem(WALLET_KEY, JSON.stringify({
      connected: false,
      address: '',
      balance: 10.0
    }));
  }
};

// Wallet functions
export const connectWallet = async (): Promise<{ address: string, balance: number }> => {
  try {
    if (!window.solana) {
      throw new Error('Phantom wallet not installed');
    }

    // Check if already connected
    if (window.solana.isConnected) {
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      const publicKey = resp.publicKey.toString();
      
      try {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        const balanceInSol = balance / LAMPORTS_PER_SOL;
        
        const wallet = {
          connected: true,
          address: publicKey,
          balance: balanceInSol
        };
        
        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
        
        return { address: publicKey, balance: balanceInSol };
      } catch (error) {
        console.warn('Failed to get balance, using cached value:', error);
        // Use cached balance if available
        const cachedWallet = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}');
        return { 
          address: publicKey, 
          balance: cachedWallet.balance || 10.0 
        };
      }
    }

    // If not connected, request connection
    const resp = await window.solana.connect();
    const publicKey = resp.publicKey.toString();
    
    try {
      const balance = await connection.getBalance(new PublicKey(publicKey));
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      const wallet = {
        connected: true,
        address: publicKey,
        balance: balanceInSol
      };
      
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
      
      return { address: publicKey, balance: balanceInSol };
    } catch (error) {
      console.warn('Failed to get balance, using default value:', error);
      // Use default balance if balance check fails
      const wallet = {
        connected: true,
        address: publicKey,
        balance: 10.0
      };
      
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
      
      return { address: publicKey, balance: 10.0 };
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw new Error('Failed to connect wallet. Please try again.');
  }
};

export const disconnectWallet = async (): Promise<void> => {
  try {
    if (window.solana) {
      await window.solana.disconnect();
    }
    
    const wallet = {
      connected: false,
      address: '',
      balance: 0
    };
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
};

export const getWalletStatus = async (): Promise<{ connected: boolean, address: string, balance: number }> => {
  try {
    if (!window.solana) {
      return { connected: false, address: '', balance: 0 };
    }

    // Check if already connected
    if (window.solana.isConnected) {
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      const publicKey = resp.publicKey.toString();
      
      try {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        const balanceInSol = balance / LAMPORTS_PER_SOL;

        const wallet = {
          connected: true,
          address: publicKey,
          balance: balanceInSol
        };

        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
        return wallet;
      } catch (error) {
        console.warn('Failed to get balance, using cached value:', error);
        // Use cached wallet data if available
        const cachedWallet = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}');
        if (cachedWallet.connected && cachedWallet.address === publicKey) {
          return cachedWallet;
        }
      }
    }

    return { connected: false, address: '', balance: 0 };
  } catch (error) {
    console.error('Failed to get wallet status:', error);
    return { connected: false, address: '', balance: 0 };
  }
};

// Market functions
export const getMarkets = async (): Promise<Market[]> => {
  initStorage();
  return JSON.parse(localStorage.getItem(MARKETS_KEY) || '[]');
};

export const getMarket = async (id: string): Promise<Market | null> => {
  const markets = await getMarkets();
  return markets.find(m => m.id === id) || null;
};

export const createMarket = async (
  title: string,
  description: string,
  endTime: number,
  tags: string[]
): Promise<Market> => {
  const wallet = await getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  
  const markets = await getMarkets();
  
  const newMarket: Market = {
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    description,
    endTime,
    resolved: false,
    creator: wallet.address,
    totalYesBets: 0,
    totalNoBets: 0,
    tags,
    createdAt: Date.now(),
    status: 'active'
  };
  
  markets.push(newMarket);
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
  
  return newMarket;
};

export const deleteMarket = async (marketId: string): Promise<void> => {
  const wallet = await getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  
  const markets = await getMarkets();
  const marketIndex = markets.findIndex(m => m.id === marketId);
  
  if (marketIndex === -1) throw new Error('Market not found');
  if (markets[marketIndex].creator !== wallet.address) throw new Error('Not the market creator');
  if (markets[marketIndex].resolved) throw new Error('Cannot delete resolved market');
  
  // Remove market
  markets.splice(marketIndex, 1);
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
  
  // Remove associated bets
  const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
  const updatedBets = bets.filter(bet => bet.marketId !== marketId);
  localStorage.setItem(BETS_KEY, JSON.stringify(updatedBets));
};

export const placeBet = async (
  marketId: string,
  amount: number,
  prediction: boolean
): Promise<UserBet> => {
  const wallet = await getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  if (wallet.balance < amount) throw new Error('Insufficient balance');
  
  try {
    // Create and sign transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.address),
        toPubkey: new PublicKey(process.env.VITE_PLATFORM_WALLET || ''),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );
    
    const signed = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);
    
    const markets = await getMarkets();
    const marketIndex = markets.findIndex(m => m.id === marketId);
    
    if (marketIndex === -1) throw new Error('Market not found');
    if (markets[marketIndex].resolved) throw new Error('Market already resolved');
    if (markets[marketIndex].endTime < Date.now()) throw new Error('Market expired');
    
    // Update market totals
    if (prediction) {
      markets[marketIndex].totalYesBets += amount;
    } else {
      markets[marketIndex].totalNoBets += amount;
    }
    
    localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
    
    // Create bet record
    const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
    
    const newBet: UserBet = {
      marketId,
      userAddress: wallet.address,
      amount,
      prediction,
      timestamp: Date.now(),
      claimed: false
    };
    
    bets.push(newBet);
    localStorage.setItem(BETS_KEY, JSON.stringify(bets));
    
    return newBet;
  } catch (error) {
    console.error('Failed to place bet:', error);
    throw error;
  }
};

export const getUserBets = async (marketId?: string): Promise<UserBet[]> => {
  initStorage();
  
  const wallet = await getWalletStatus();
  if (!wallet.connected) return [];
  
  const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
  
  return bets.filter(bet => 
    bet.userAddress === wallet.address && 
    (marketId ? bet.marketId === marketId : true)
  );
};

export const resolveMarket = async (marketId: string, result: boolean): Promise<Market> => {
  const wallet = await getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  
  const markets = await getMarkets();
  const marketIndex = markets.findIndex(m => m.id === marketId);
  
  if (marketIndex === -1) throw new Error('Market not found');
  if (markets[marketIndex].resolved) throw new Error('Market already resolved');
  if (markets[marketIndex].creator !== wallet.address) throw new Error('Not the market creator');
  
  // Update market status
  markets[marketIndex].resolved = true;
  markets[marketIndex].result = result;
  markets[marketIndex].status = 'resolved';
  
  // Get all bets for this market
  const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
  const marketBets = bets.filter(bet => bet.marketId === marketId);
  
  // Calculate total pool and winning pool
  const totalPool = markets[marketIndex].totalYesBets + markets[marketIndex].totalNoBets;
  const winningPool = result ? markets[marketIndex].totalYesBets : markets[marketIndex].totalNoBets;
  const losingPool = result ? markets[marketIndex].totalNoBets : markets[marketIndex].totalYesBets;
  
  // Process winnings for each winning bet
  for (const bet of marketBets) {
    if (bet.prediction === result && !bet.claimed) {
      const userProportion = bet.amount / winningPool;
      const winnings = bet.amount + (losingPool * userProportion);
      
      try {
        // Create and sign transaction for winnings
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(process.env.VITE_PLATFORM_WALLET || ''),
            toPubkey: new PublicKey(bet.userAddress),
            lamports: winnings * LAMPORTS_PER_SOL
          })
        );
        
        const signed = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature);
        
        // Mark bet as claimed
        bet.claimed = true;
      } catch (error) {
        console.error('Failed to send winnings:', error);
      }
    }
  }
  
  // Save updated bets
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  
  // Save updated markets
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
  
  return markets[marketIndex];
};

export const claimWinnings = async (marketId: string): Promise<{ claimed: boolean, amount: number }> => {
  initStorage();
  
  const wallet = await getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  
  const markets = await getMarkets();
  const market = markets.find(m => m.id === marketId);
  
  if (!market) throw new Error('Market not found');
  if (!market.resolved) throw new Error('Market not resolved yet');
  
  const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
  const userBetsForMarket = bets.filter(bet => 
    bet.marketId === marketId && 
    bet.userAddress === wallet.address &&
    !bet.claimed
  );
  
  if (userBetsForMarket.length === 0) throw new Error('No unclaimed bets found');
  
  let winningAmount = 0;
  
  // Check if user bet on the winning side
  const winningBets = userBetsForMarket.filter(bet => bet.prediction === market.result);
  
  if (winningBets.length > 0) {
    // Calculate winnings based on the bet amounts and total market bets
    const totalMarketBets = market.totalYesBets + market.totalNoBets;
    const winningPool = market.result ? market.totalYesBets : market.totalNoBets;
    const losingPool = market.result ? market.totalNoBets : market.totalYesBets;
    
    // Calculate the proportion of the winning pool that belongs to this user
    const userTotalBet = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    const userProportion = userTotalBet / winningPool;
    
    // Winnings = original bet + proportion of losing pool
    winningAmount = userTotalBet + (losingPool * userProportion);
  }
  
  // Mark bets as claimed
  bets.forEach(bet => {
    if (bet.marketId === marketId && bet.userAddress === wallet.address) {
      bet.claimed = true;
    }
  });
  
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  
  // Update wallet balance if there are winnings
  if (winningAmount > 0) {
    wallet.balance += winningAmount;
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  }
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return { claimed: true, amount: winningAmount };
};
