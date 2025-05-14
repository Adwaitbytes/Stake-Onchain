import { AIPrediction } from "../types/market";
import { getWalletStatus } from "./solanaService";

const GOOGLE_AI_STUDIO_API_KEY = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;

// Enhanced AI prediction service with Solana focus
export const getAIPrediction = async (marketId: string, question: string): Promise<AIPrediction> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Generate a "realistic" looking prediction based on the question
  // In a real app, this would call an actual AI prediction service
  
  // Use the marketId as a seed for pseudorandom but consistent predictions
  const seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomFactor = (seed % 20) / 100; // 0-0.2 variation
  
  // Default values for a balanced prediction
  let yesPercentage = 0.5;
  let confidenceBase = 0.7;
  
  // Adjust prediction based on question keywords
  const lowerQuestion = question.toLowerCase();
  
  // Solana-specific predictions
  if (lowerQuestion.includes("solana") || lowerQuestion.includes("sol")) {
    yesPercentage = 0.68 + randomFactor;
    confidenceBase = 0.78;
  } else if (lowerQuestion.includes("bitcoin") || lowerQuestion.includes("btc")) {
    yesPercentage = 0.63 + randomFactor;
    confidenceBase = 0.75;
  } else if (lowerQuestion.includes("ethereum") || lowerQuestion.includes("eth")) {
    yesPercentage = 0.58 + randomFactor;
    confidenceBase = 0.72;
  } else if (lowerQuestion.includes("market") || lowerQuestion.includes("price")) {
    yesPercentage = 0.52 + randomFactor;
    confidenceBase = 0.68;
  } else if (lowerQuestion.includes("launch") || lowerQuestion.includes("release")) {
    yesPercentage = 0.72 + randomFactor;
    confidenceBase = 0.65;
  } else if (lowerQuestion.includes("fail") || lowerQuestion.includes("crash")) {
    yesPercentage = 0.35 + randomFactor;
    confidenceBase = 0.7;
  } else if (lowerQuestion.includes("success") || lowerQuestion.includes("win")) {
    yesPercentage = 0.75 + randomFactor;
    confidenceBase = 0.68;
  } else if (lowerQuestion.includes("nft") || lowerQuestion.includes("token")) {
    yesPercentage = 0.62 + randomFactor;
    confidenceBase = 0.73;
  } else if (lowerQuestion.includes("defi") || lowerQuestion.includes("finance")) {
    yesPercentage = 0.57 + randomFactor;
    confidenceBase = 0.71;
  }
  
  // Ensure percentages are within bounds
  yesPercentage = Math.min(Math.max(yesPercentage, 0.1), 0.9);
  const noPercentage = 1 - yesPercentage;
  
  // Slightly randomize confidence but keep it realistic
  const confidence = confidenceBase + (Math.random() * 0.2 - 0.1);
  
  // Generate factors based on the prediction
  const factors = generateFactors(question, yesPercentage > 0.5);
  
  // Add on-chain data analysis if available
  const enhancedFactors = await enhanceWithOnChainData(factors, question);
  
  return {
    marketId,
    yesPercentage: Math.round(yesPercentage * 100),
    noPercentage: Math.round(noPercentage * 100),
    confidence,
    factors: enhancedFactors,
    timestamp: Date.now()
  };
};

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
export const getSolanaMarketTrends = async (): Promise<{
  trend: 'bullish' | 'bearish' | 'neutral',
  confidence: number,
  factors: string[]
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would call an AI service that analyzes on-chain data
  
  // For demo purposes, generate a random trend
  const trendValue = Math.random();
  let trend: 'bullish' | 'bearish' | 'neutral';
  let factors: string[] = [];
  
  if (trendValue > 0.6) {
    trend = 'bullish';
    factors = [
      "Increased developer activity on Solana in the last 30 days",
      "Growing number of new wallet addresses",
      "Rising transaction volume across major Solana dApps",
      "Positive sentiment in social media discussions",
      "Institutional investment flowing into Solana ecosystem"
    ];
  } else if (trendValue < 0.4) {
    trend = 'bearish';
    factors = [
      "Decreased transaction volume in the last 7 days",
      "Reduction in new project launches",
      "Increased token transfers to exchanges",
      "Technical resistance levels being tested",
      "Negative sentiment in developer communities"
    ];
  } else {
    trend = 'neutral';
    factors = [
      "Stable transaction volumes week-over-week",
      "Balanced token inflows and outflows",
      "Consistent developer activity",
      "Mixed social sentiment indicators",
      "Market consolidation phase detected"
    ];
  }
  
  return {
    trend,
    confidence: 0.65 + (Math.random() * 0.2),
    factors: factors
  };
};

// New function: Generate AI predictions for popular Solana markets
export const getPopularSolanaPredictions = async (): Promise<{
  topic: string,
  prediction: number, // 0-100 percentage
  timeframe: string
}[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would call an AI service
  return [
    {
      topic: "SOL price above $100 by end of month",
      prediction: 72,
      timeframe: "30 days"
    },
    {
      topic: "New Solana NFT standard adoption",
      prediction: 68,
      timeframe: "60 days"
    },
    {
      topic: "Major DeFi protocol launch on Solana",
      prediction: 81,
      timeframe: "45 days"
    },
    {
      topic: "Solana TPS record broken",
      prediction: 54,
      timeframe: "90 days"
    },
    {
      topic: "New Solana gaming platform with 100K+ users",
      prediction: 63,
      timeframe: "120 days"
    }
  ];
};
