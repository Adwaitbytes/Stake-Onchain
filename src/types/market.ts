export interface Market {
  id: string;
  title: string;
  description: string;
  creator: string;
  endTime: number;
  totalYesBets: number;
  totalNoBets: number;
  resolved: boolean;
  outcome?: 'YES' | 'NO';
  createdAt: number;
  category: string;
  tags: string[];
  liquidity: number;
  volume: number;
  participants: number;
  lastUpdated: number;
}

export interface UserBet {
  marketId: string;
  userAddress: string;
  amount: number;
  prediction: boolean; // true = yes, false = no
  timestamp: number;
  claimed: boolean;
}

export interface AIPrediction {
  outcome: 'YES' | 'NO';
  confidence: number;
  factors: string[];
  recommendation: 'STRONG' | 'MODERATE' | 'WEAK';
  timestamp?: number;
}

export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalParticipants: number;
  averageLiquidity: number;
  topCategories: {
    category: string;
    count: number;
  }[];
  recentActivity: {
    type: 'CREATE' | 'BET' | 'RESOLVE';
    marketId: string;
    timestamp: number;
    details: string;
  }[];
}
