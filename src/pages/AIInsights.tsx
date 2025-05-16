import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAIPrediction, getSolanaMarketTrends, getPopularSolanaPredictions } from "@/services/aiPredictionService";
import { Market } from "@/types/market";
import { getMarkets } from "@/services/mockBlockchainService";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart2, Clock } from "lucide-react";

export default function AIInsights() {
  const [trends, setTrends] = useState<{
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    factors: string[];
  } | null>(null);
  
  const [popularPredictions, setPopularPredictions] = useState<{
    topic: string;
    prediction: number;
    timeframe: string;
  }[]>([]);
  
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [trendsData, predictionsData, marketsData] = await Promise.all([
        getSolanaMarketTrends(),
        getPopularSolanaPredictions(),
        getMarkets()
      ]);

      setTrends(trendsData);
      setPopularPredictions(predictionsData);
      setActiveMarkets(marketsData.filter(m => !m.resolved));
    } catch (error) {
      console.error('Failed to load AI insights:', error);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'bullish' | 'bearish' | 'neutral') => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="h-6 w-6 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-6 w-6 text-red-500" />;
      default:
        return <Minus className="h-6 w-6 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'bullish' | 'bearish' | 'neutral') => {
    switch (trend) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          AI Market Insights
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4 rounded-lg bg-red-500/10">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Market Trends Card */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Market Trends
                </h2>
                <Button variant="ghost" onClick={loadData} className="text-purple-400">
                  Refresh
                </Button>
              </div>
              
              {trends && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Overall Sentiment</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trends.trend)}
                      <span className={`font-semibold ${getTrendColor(trends.trend)}`}>
                        {trends.trend.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{Math.round(trends.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${trends.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Key Factors</h3>
                    <ul className="space-y-2">
                      {trends.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>

            {/* Popular Predictions Card */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-purple-400" />
                  Popular Predictions
                </h2>
              </div>
              
              <div className="space-y-4">
                {popularPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{prediction.topic}</span>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {prediction.timeframe}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${prediction.prediction}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{prediction.prediction}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Markets Card */}
            <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Active Markets
                </h2>
              </div>
              
              <div className="space-y-4">
                {activeMarkets.map(market => (
                  <div key={market.id} className="p-4 rounded-lg bg-gray-700/50">
                    <h3 className="font-medium mb-2">{market.title}</h3>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Total Bets: {market.totalYesBets + market.totalNoBets} SOL</span>
                      <span>Ends: {new Date(market.endTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
} 