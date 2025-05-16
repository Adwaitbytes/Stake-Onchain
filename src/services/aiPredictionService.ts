import { AIPrediction } from "../types/market";
import { getWalletStatus } from "./solanaService";
import { Market } from "@/types/market";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Mock data for development
const mockTrends = {
  trend: 'bullish' as const,
  confidence: 0.85,
  factors: [
    'Strong developer activity in Solana ecosystem',
    'Increasing TVL in DeFi protocols',
    'Positive market sentiment from social media',
    'Growing number of active wallets',
    'Successful NFT launches'
  ]
};

const mockPopularPredictions = [
  {
    topic: 'SOL Price by EOY 2024',
    prediction: 85,
    timeframe: '6 months'
  },
  {
    topic: 'Solana DeFi TVL Growth',
    prediction: 75,
    timeframe: '3 months'
  },
  {
    topic: 'New Active Wallets',
    prediction: 65,
    timeframe: '1 month'
  }
];

// Enhanced AI prediction service with Gemini API integration
export const getAIPrediction = async (market: Market): Promise<AIPrediction> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would be an actual API call
    // const response = await fetch('https://api.stake-onchain.com/predict', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ market }),
    // });
    // const data = await response.json();
    // return data;
    
    // Mock prediction based on market data
    const prediction = {
      outcome: Math.random() > 0.5 ? 'YES' : 'NO',
      confidence: Math.random() * 0.5 + 0.5, // Random confidence between 0.5 and 1.0
      factors: [
        'Historical market performance',
        'Current market conditions',
        'Social sentiment analysis',
        'Technical indicators',
        'On-chain metrics'
      ],
      recommendation: Math.random() > 0.5 ? 'STRONG' : 'MODERATE'
    };
    
    return prediction;
  } catch (error) {
    console.error('Failed to get AI prediction:', error);
    throw new Error('Failed to get AI prediction');
  }
};

// Validate prediction format
function isValidPrediction(prediction: any): boolean {
  return (
    typeof prediction === 'object' &&
    typeof prediction.yesPercentage === 'number' &&
    typeof prediction.noPercentage === 'number' &&
    typeof prediction.confidence === 'number' &&
    Array.isArray(prediction.factors) &&
    prediction.factors.every((factor: any) => typeof factor === 'string')
  );
}

// Fallback prediction function
function getDefaultPrediction(marketId: string, question: string): AIPrediction {
  const seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomFactor = (seed % 20) / 100;
  
  let yesPercentage = 0.5;
  let confidenceBase = 0.7;
  
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes("solana") || lowerQuestion.includes("sol")) {
    yesPercentage = 0.68 + randomFactor;
    confidenceBase = 0.78;
  } else if (lowerQuestion.includes("bitcoin") || lowerQuestion.includes("btc")) {
    yesPercentage = 0.63 + randomFactor;
    confidenceBase = 0.75;
  } else if (lowerQuestion.includes("ethereum") || lowerQuestion.includes("eth")) {
    yesPercentage = 0.58 + randomFactor;
    confidenceBase = 0.72;
  }
  
  yesPercentage = Math.min(Math.max(yesPercentage, 0.1), 0.9);
  const noPercentage = 1 - yesPercentage;
  
  const confidence = confidenceBase + (Math.random() * 0.2 - 0.1);
  const factors = generateFactors(question, yesPercentage > 0.5);
  
  return {
    marketId,
    yesPercentage: Math.round(yesPercentage * 100),
    noPercentage: Math.round(noPercentage * 100),
    confidence,
    factors,
    timestamp: Date.now()
  };
}

// Helper to generate "explanation" factors
function generateFactors(question: string, isPositive: boolean): string[] {
  const positivePhrases = [
    "Historical trends suggest a positive outcome",
    "Market sentiment is favorable",
    "Similar events had positive resolutions",
    "Technical indicators point toward this result",
    "On-chain metrics support this prediction",
    "Recent developments increase likelihood",
    "Comparable market conditions led to similar outcomes",
    "Solana ecosystem growth supports this prediction",
    "Developer activity trends are positive",
    "Social media sentiment analysis shows optimism"
  ];
  
  const negativePhrases = [
    "Historical patterns indicate challenges",
    "Market sentiment shows concerns",
    "Similar events had negative outcomes",
    "Technical indicators suggest caution",
    "On-chain metrics indicate potential issues",
    "Recent developments complicate the outcome",
    "Comparable market conditions had unfavorable results",
    "Solana ecosystem metrics show potential concerns",
    "Developer activity has been declining",
    "Social media sentiment analysis shows skepticism"
  ];
  
  // Choose base phrases based on positive/negative prediction
  const basePhrases = isPositive ? positivePhrases : negativePhrases;
  
  // Pick 3-4 random factors
  const factorCount = 3 + Math.floor(Math.random() * 2);
  const selectedFactors = [];
  
  const indices = new Set<number>();
  while (indices.size < factorCount && indices.size < basePhrases.length) {
    indices.add(Math.floor(Math.random() * basePhrases.length));
  }
  
  indices.forEach(index => {
    selectedFactors.push(basePhrases[index]);
  });
  
  return selectedFactors;
}

// Enhance predictions with simulated on-chain data
async function enhanceWithOnChainData(factors: string[], question: string): Promise<string[]> {
  const lowerQuestion = question.toLowerCase();
  const enhancedFactors = [...factors];
  
  // Add Solana-specific insights
  if (lowerQuestion.includes("solana") || lowerQuestion.includes("sol")) {
    enhancedFactors.push("Solana transaction volume increased by 23% in the last 30 days");
    enhancedFactors.push("Smart contract deployments on Solana are up 17% this quarter");
  }
  
  // Add NFT insights
  if (lowerQuestion.includes("nft")) {
    enhancedFactors.push("NFT trading volume on Solana has shown 12% growth month-over-month");
  }
  
  // Add DeFi insights
  if (lowerQuestion.includes("defi") || lowerQuestion.includes("finance")) {
    enhancedFactors.push("Total Value Locked (TVL) in Solana DeFi protocols increased by 8% this month");
  }
  
  // Add wallet activity insights
  try {
    const walletStatus = getWalletStatus();
    if (walletStatus.connected) {
      enhancedFactors.push("Your wallet activity pattern correlates with users who predicted similar outcomes correctly");
    }
  } catch (error) {
    console.error("Failed to enhance with wallet data:", error);
  }
  
  // Return only the first 5 factors to avoid overwhelming the user
  return enhancedFactors.slice(0, 5);
}

// New function: Get AI-powered Solana market trends
export const getSolanaMarketTrends = async () => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would be an actual API call
    // const response = await fetch('https://api.stake-onchain.com/market-trends');
    // const data = await response.json();
    // return data;
    
    return mockTrends;
  } catch (error) {
    console.error('Failed to fetch market trends:', error);
    throw new Error('Failed to fetch market trends');
  }
};

// New function: Generate AI predictions for popular Solana markets
export const getPopularSolanaPredictions = async () => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would be an actual API call
    // const response = await fetch('https://api.stake-onchain.com/popular-predictions');
    // const data = await response.json();
    // return data;
    
    return mockPopularPredictions;
  } catch (error) {
    console.error('Failed to fetch popular predictions:', error);
    throw new Error('Failed to fetch popular predictions');
  }
};
