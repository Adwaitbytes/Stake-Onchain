
export interface Market {
  id: string;
  title: string;
  description: string;
  endTime: number; // Unix timestamp
  resolved: boolean;
  result?: boolean; // true = yes, false = no, undefined = not resolved yet
  creator: string; // creator's address
  totalYesBets: number;
  totalNoBets: number;
  tags: string[];
  createdAt: number; // Unix timestamp
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
  marketId: string;
  yesPercentage: number;
  noPercentage: number;
  confidence: number; // 0-1, higher means more confident
  factors: string[]; // reasons for the prediction
  timestamp: number;
}
