import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSolanaMarketTrends, getPopularSolanaPredictions } from "@/services/aiPredictionService";
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, BarChart3, TrendingUp, Clock, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const GOOGLE_AI_STUDIO_API_KEY = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;

function AIChatBot() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: input }] }],
          }),
        }
      );
      const data = await res.json();
      const aiMsg = data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response]";
      setMessages((msgs) => [...msgs, { role: "ai", content: aiMsg }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: "ai", content: "[Error fetching AI response]" }]);
    }
    setLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="glass-card rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Ask Solana AI (Real-Time)</h2>
      <div className="h-64 overflow-y-auto bg-black/10 rounded p-3 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span className={msg.role === "user" ? "font-bold text-neural-accent" : "font-bold text-green-400"}>
              {msg.role === "user" ? "You" : "Solana AI"}:
            </span>
            <span className="ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask anything about Solana, crypto, or markets..."
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

export default function SolanaInsights() {
  const [marketTrends, setMarketTrends] = useState<{
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    factors: string[];
  } | null>(null);
  
  const [popularPredictions, setPopularPredictions] = useState<{
    topic: string;
    prediction: number;
    timeframe: string;
  }[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const [trends, predictions] = await Promise.all([
          getSolanaMarketTrends(),
          getPopularSolanaPredictions()
        ]);
        
        setMarketTrends(trends);
        setPopularPredictions(predictions);
      } catch (error) {
        console.error("Failed to fetch Solana insights:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, []);
  
  const renderTrendIcon = (trend: 'bullish' | 'bearish' | 'neutral') => {
    switch (trend) {
      case 'bullish':
        return <ArrowUpCircle className="h-8 w-8 text-green-500" />;
      case 'bearish':
        return <ArrowDownCircle className="h-8 w-8 text-red-500" />;
      case 'neutral':
        return <MinusCircle className="h-8 w-8 text-yellow-500" />;
    }
  };
  
  const getTrendColor = (trend: 'bullish' | 'bearish' | 'neutral') => {
    switch (trend) {
      case 'bullish':
        return "text-green-500";
      case 'bearish':
        return "text-red-500";
      case 'neutral':
        return "text-yellow-500";
    }
  };
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "Very High";
    if (confidence >= 0.7) return "High";
    if (confidence >= 0.6) return "Moderate";
    if (confidence >= 0.5) return "Low";
    return "Very Low";
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Solana AI Insights</h1>
              <p className="text-muted-foreground mt-2">
                AI-powered analysis of Solana blockchain trends and predictions
              </p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0">
              <Brain className="mr-2 h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Powered by AI analysis of on-chain data
              </span>
            </div>
          </div>
          
          <AIChatBot />
          
          <Tabs defaultValue="market-trends" className="space-y-6">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="market-trends">
                <BarChart3 className="h-4 w-4 mr-2" />
                Market Trends
              </TabsTrigger>
              <TabsTrigger value="predictions">
                <TrendingUp className="h-4 w-4 mr-2" />
                Predictions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="market-trends" className="space-y-6">
              {loading ? (
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-7 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-4/5"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ) : marketTrends ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl flex items-center">
                        {renderTrendIcon(marketTrends.trend)}
                        <span className={`ml-2 capitalize ${getTrendColor(marketTrends.trend)}`}>
                          {marketTrends.trend} Outlook
                        </span>
                      </CardTitle>
                      
                      <Badge variant={marketTrends.trend === 'bullish' ? 'default' : 
                              marketTrends.trend === 'bearish' ? 'destructive' : 'outline'}>
                        {getConfidenceLabel(marketTrends.confidence)} Confidence
                      </Badge>
                    </div>
                    <CardDescription>
                      AI analysis based on recent on-chain activity and market signals
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Confidence Level</div>
                      <Progress value={marketTrends.confidence * 100} 
                        className={marketTrends.trend === 'bullish' ? 'bg-green-100' : 
                                  marketTrends.trend === 'bearish' ? 'bg-red-100' : 'bg-yellow-100'} />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Key Factors</h3>
                      <ul className="space-y-2">
                        {marketTrends.factors.map((factor, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 mt-1">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="outline" asChild>
                      <Link to="/markets">
                        Explore Prediction Markets
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Unable to load market trends</CardTitle>
                    <CardDescription>
                      There was an error loading the AI market analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="predictions" className="space-y-6">
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-5 bg-muted-foreground/20 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-16 bg-muted-foreground/20 rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : popularPredictions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {popularPredictions.map((prediction, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{prediction.topic}</CardTitle>
                        <CardDescription className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Timeframe: {prediction.timeframe}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Likelihood</span>
                            <span className="font-medium">{prediction.prediction}%</span>
                          </div>
                          <Progress 
                            value={prediction.prediction} 
                            className={prediction.prediction > 65 ? 'bg-green-100' : 
                                      prediction.prediction < 40 ? 'bg-red-100' : 'bg-yellow-100'} 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Unlikely</span>
                            <span>Likely</span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full" asChild>
                          <Link to="/markets">
                            Find Related Markets
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No predictions available</CardTitle>
                    <CardDescription>
                      Unable to load AI predictions at this time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 