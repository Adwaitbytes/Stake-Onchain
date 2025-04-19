import { AIPrediction } from "../types/market";

// Mock AI prediction service
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
  
  if (lowerQuestion.includes("bitcoin") || lowerQuestion.includes("btc")) {
    yesPercentage = 0.63 + randomFactor;
    confidenceBase = 0.75;
  } else if (lowerQuestion.includes("ethereum") || lowerQuestion.includes("eth")) {
    yesPercentage = 0.58 + randomFactor;
    confidenceBase = 0.72;
  } else if (lowerQuestion.includes("arbitrum")) {
    yesPercentage = 0.67 + randomFactor;
    confidenceBase = 0.78;
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
  }
  
  // Ensure percentages are within bounds
  yesPercentage = Math.min(Math.max(yesPercentage, 0.1), 0.9);
  const noPercentage = 1 - yesPercentage;
  
  // Slightly randomize confidence but keep it realistic
  const confidence = confidenceBase + (Math.random() * 0.2 - 0.1);
  
  // Generate factors based on the prediction
  const factors = generateFactors(question, yesPercentage > 0.5);
  
  return {
    marketId,
    yesPercentage: Math.round(yesPercentage * 100),
    noPercentage: Math.round(noPercentage * 100),
    confidence,
    factors,
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
    "Comparable market conditions led to similar outcomes"
  ];
  
  const negativePhrases = [
    "Historical patterns indicate challenges",
    "Market sentiment shows concerns",
    "Similar events had negative outcomes",
    "Technical indicators suggest caution",
    "On-chain metrics indicate potential issues",
    "Recent developments complicate the outcome",
    "Comparable market conditions had unfavorable results"
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
