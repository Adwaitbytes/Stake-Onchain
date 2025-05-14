import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { MarketCard } from "@/components/markets/market-card";
import { getMarkets } from "@/services/mockBlockchainService";
import { Market } from "@/types/market";
import { BarChart, Clock, TrendingUp, Dices } from "lucide-react";

export default function Home() {
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const allMarkets = await getMarkets();
        // Get only active markets, sorted by total bets
        const activeMarkets = allMarkets
          .filter(market => !market.resolved && market.endTime > Date.now())
          .sort((a, b) => (b.totalYesBets + b.totalNoBets) - (a.totalYesBets + a.totalNoBets))
          .slice(0, 3);
        
        setFeaturedMarkets(activeMarkets);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarkets();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Hero section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neural-accent/20 rounded-full filter blur-3xl animate-float opacity-70"></div>
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-neural-highlight/10 rounded-full filter blur-3xl animate-pulse-glow opacity-50"></div>
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-neural-glow/20 rounded-full filter blur-3xl animate-float opacity-60" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight ai-gradient-text">
                Bet on the Future <br/>Powered by AI
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                AIPredict combines AI probability predictions with blockchain
                technology for a next-generation prediction market experience.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/markets">
                  <Button size="lg" className="bg-neural-accent hover:bg-neural-accent/90 neural-glow">
                    <BarChart className="mr-2 h-5 w-5" />
                    Explore Markets
                  </Button>
                </Link>
                
                <Link to="/games">
                  <Button size="lg" variant="outline" className="neural-glow">
                    <Dices className="mr-2 h-5 w-5" />
                    Play Games
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16 bg-gradient-to-b from-transparent to-neural-dark/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 ai-gradient-text">Powered by Solana</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neural-accent/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-neural-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast Confirmations</h3>
                <p className="text-muted-foreground">
                  Solana delivers fast transaction confirmations with minimal wait times.
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neural-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-neural-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Low Gas Fees</h3>
                <p className="text-muted-foreground">
                  Enjoy drastically lower gas fees compared to others, making small bets economical.
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neural-accent/20 flex items-center justify-center">
                  <Dices className="h-6 w-6 text-neural-light" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Provably Fair Games</h3>
                <p className="text-muted-foreground">
                  All games use transparent, verifiable blockchain randomness for provable fairness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What's New section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What's New</h2>
            
            <div className="glass-card rounded-xl p-8 mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <Dices className="h-12 w-12 mx-auto mb-6 text-neural-light" />
                <h3 className="text-2xl font-bold mb-4">New Staking Games</h3>
                <p className="text-lg mb-6">
                  We've added exciting new staking games to AIPredict! Try your luck with Coin Flip and Dice Roll, both offering provably fair gameplay with blockchain transparency.
                </p>
                <Link to="/games">
                  <Button size="lg" className="bg-neural-accent hover:bg-neural-accent/90">
                    Play Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured markets section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Featured Markets</h2>
              <Link to="/markets" className="text-neural-light hover:text-neural-light/80 text-sm font-medium">
                View All →
              </Link>
            </div>
            
            {loading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-xl p-5 animate-pulse h-[280px]">
                    <div className="h-6 bg-muted-foreground/20 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-2/3 mb-6"></div>
                    <div className="h-16 bg-muted-foreground/20 rounded w-full mb-6"></div>
                    <div className="flex gap-2 mb-6">
                      <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
                      <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-muted-foreground/20 rounded w-20"></div>
                      <div className="h-8 bg-muted-foreground/20 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredMarkets.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {featuredMarkets.map((market) => (
                  <MarketCard 
                    key={market.id} 
                    market={market}
                    aiPrediction={{
                      yesPercentage: 50 + Math.floor(Math.random() * 30),
                      noPercentage: 50 - Math.floor(Math.random() * 30),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No active markets found.</p>
                <Link to="/create">
                  <Button>Create the First Market</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-2xl font-bold bg-gradient-to-r from-neural-light via-neural-highlight to-neural-glow bg-clip-text text-transparent">
                AIPredict
              </div>
              <p className="text-sm text-muted-foreground mt-1">AI-Powered Prediction Markets on Solana</p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 AIPredict. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
