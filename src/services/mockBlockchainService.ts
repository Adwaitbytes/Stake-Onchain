
import { Market, UserBet } from "../types/market";

// Mock localStorage-based blockchain service for demo purposes
// In a real app, this would interact with Arbitrum Stylus contracts

// Storage keys
const MARKETS_KEY = 'aipredict_markets';
const BETS_KEY = 'aipredict_bets';
const WALLET_KEY = 'aipredict_wallet';

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
      balance: 10.0 // Initial test ETH
    }));
  }
};

// Wallet functions
export const connectWallet = async (): Promise<{ address: string, balance: number }> => {
  initStorage();
  
  // Generate a mock wallet address if not connected
  const randomAddress = '0x' + Array(40).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)).join('');
  
  const wallet = {
    connected: true,
    address: randomAddress,
    balance: 10.0
  };
  
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return { address: wallet.address, balance: wallet.balance };
};

export const disconnectWallet = (): void => {
  const wallet = {
    connected: false,
    address: '',
    balance: 0
  };
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
};

export const getWalletStatus = (): { connected: boolean, address: string, balance: number } => {
  initStorage();
  return JSON.parse(localStorage.getItem(WALLET_KEY) || '{"connected":false,"address":"","balance":0}');
};

// Market functions
export const getMarkets = async (): Promise<Market[]> => {
  initStorage();
  
  // Simulate blockchain delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
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
  initStorage();
  
  const wallet = getWalletStatus();
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
    createdAt: Date.now()
  };
  
  markets.push(newMarket);
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return newMarket;
};

export const placeBet = async (
  marketId: string,
  amount: number,
  prediction: boolean
): Promise<UserBet> => {
  initStorage();
  
  const wallet = getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  if (wallet.balance < amount) throw new Error('Insufficient balance');
  
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
  
  // Update wallet balance
  wallet.balance -= amount;
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return newBet;
};

export const getUserBets = async (marketId?: string): Promise<UserBet[]> => {
  initStorage();
  
  const wallet = getWalletStatus();
  if (!wallet.connected) return [];
  
  const bets: UserBet[] = JSON.parse(localStorage.getItem(BETS_KEY) || '[]');
  
  return bets.filter(bet => 
    bet.userAddress === wallet.address && 
    (marketId ? bet.marketId === marketId : true)
  );
};

export const resolveMarket = async (marketId: string, result: boolean): Promise<Market> => {
  initStorage();
  
  const wallet = getWalletStatus();
  if (!wallet.connected) throw new Error('Wallet not connected');
  
  const markets = await getMarkets();
  const marketIndex = markets.findIndex(m => m.id === marketId);
  
  if (marketIndex === -1) throw new Error('Market not found');
  if (markets[marketIndex].resolved) throw new Error('Market already resolved');
  if (markets[marketIndex].creator !== wallet.address) throw new Error('Not the market creator');
  
  markets[marketIndex].resolved = true;
  markets[marketIndex].result = result;
  
  localStorage.setItem(MARKETS_KEY, JSON.stringify(markets));
  
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return markets[marketIndex];
};

export const claimWinnings = async (marketId: string): Promise<{ claimed: boolean, amount: number }> => {
  initStorage();
  
  const wallet = getWalletStatus();
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
