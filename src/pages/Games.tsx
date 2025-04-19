
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { getUserGameStats } from "@/services/gameService";
import { getWalletStatus } from "@/services/arbitrumService";
import { GameStats } from "@/types/games";
import { Dices, CoinsIcon, Dice1, Trophy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Games() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({ connected: false, address: "", balance: 0 });
  
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const walletStatus = await getWalletStatus();
        setWallet(walletStatus);
      } catch (error) {
        console.error("Failed to get wallet status:", error);
      }
    };
    
    fetchWallet();
  }, []);
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!wallet.connected) {
        setLoading(false);
        return;
      }
      
      try {
        const gameStats = await getUserGameStats();
        setStats(gameStats);
      } catch (error) {
        console.error("Failed to fetch game stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [wallet.connected]);
  
  const netProfit = stats ? stats.totalPayout - stats.totalWagered : 0;
  const profitPercentage = stats && stats.totalWagered > 0 
    ? (netProfit / stats.totalWagered) * 100
    : 0;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Provably Fair Games</h1>
              <p className="text-muted-foreground">Stake ETH and test your luck on Arbitrum Stylus</p>
            </div>
            
            {wallet.connected && (
              <div className="mt-4 md:mt-0">
                <div className="glass-card rounded-lg p-3 text-sm">
                  <div className="text-muted-foreground mb-1">Your Balance</div>
                  <div className="text-xl font-semibold">{wallet.balance.toFixed(2)} ETH</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Link to="/games/coin-flip">
              <div className="glass-card rounded-xl p-6 h-full hover:scale-[1.02] transition-transform duration-300 neural-glow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Coin Flip</h2>
                  <CoinsIcon className="h-8 w-8 text-yellow-400" />
                </div>
                <p className="text-muted-foreground mb-6">
                  Flip a coin and double your stake! Guess heads or tails correctly to win.
                </p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>House Edge</span>
                    <span>2.5%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Win Multiplier</span>
                    <span className="text-green-400">1.95x</span>
                  </div>
                  <Button className="w-full mt-4 bg-neural-accent hover:bg-neural-accent/90">
                    Play Coin Flip
                  </Button>
                </div>
              </div>
            </Link>
            
            <Link to="/games/dice">
              <div className="glass-card rounded-xl p-6 h-full hover:scale-[1.02] transition-transform duration-300 neural-glow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Dice Roll</h2>
                  <Dice1 className="h-8 w-8 text-neural-light" />
                </div>
                <p className="text-muted-foreground mb-6">
                  Predict the outcome of a dice roll. Correctly guess the number to win big!
                </p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>House Edge</span>
                    <span>5%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Win Multiplier</span>
                    <span className="text-green-400">5.7x</span>
                  </div>
                  <Button className="w-full mt-4 bg-neural-accent hover:bg-neural-accent/90">
                    Play Dice Roll
                  </Button>
                </div>
              </div>
            </Link>
          </div>
          
          {wallet.connected ? (
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center mb-6">
                <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                <h2 className="text-xl font-semibold">Your Gaming Stats</h2>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-muted-foreground/20 rounded"></div>
                  <div className="h-24 bg-muted-foreground/20 rounded"></div>
                </div>
              ) : stats && stats.totalGames > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Total Games</div>
                      <div className="text-2xl font-semibold">{stats.totalGames}</div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                      <div className="text-2xl font-semibold">{stats.winRate.toFixed(1)}%</div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Total Wagered</div>
                      <div className="text-2xl font-semibold">{stats.totalWagered.toFixed(2)} ETH</div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Total Payout</div>
                      <div className="text-2xl font-semibold">{stats.totalPayout.toFixed(2)} ETH</div>
                    </div>
                  </div>
                  
                  <div className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm flex items-center">
                        <span>Profit/Loss</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                This shows your net profit or loss compared to the total amount wagered.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className={`font-semibold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} ETH ({profitPercentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress 
                      value={50 + (profitPercentage > 100 ? 100 : profitPercentage < -100 ? -100 : profitPercentage) / 2} 
                      className="h-2" 
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't played any games yet.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link to="/games/coin-flip">
                      <Button>
                        <CoinsIcon className="mr-2 h-4 w-4" />
                        Try Coin Flip
                      </Button>
                    </Link>
                    <Link to="/games/dice">
                      <Button variant="outline">
                        <Dice1 className="mr-2 h-4 w-4" />
                        Try Dice Roll
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 text-center">
              <Dices className="h-12 w-12 mx-auto mb-4 text-neural-light opacity-70" />
              <h2 className="text-xl font-semibold mb-2">Connect Wallet to Play</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to start playing and see your gaming stats.
              </p>
            </div>
          )}
          
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
            
            <div className="glass-card rounded-xl p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Provably Fair Gaming</h3>
                  <p className="text-muted-foreground">
                    All games on AIPredict are provably fair, meaning the outcome cannot be manipulated by
                    either the player or the platform. The results are determined using blockchain-based
                    randomness that can be independently verified.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">House Edge</h3>
                  <p className="text-muted-foreground">
                    Each game has a small house edge that ensures the platform's sustainability.
                    Coin Flip has a 2.5% house edge, while Dice Roll has a 5% house edge.
                    These are significantly lower than traditional gambling platforms.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Contract Security</h3>
                  <p className="text-muted-foreground">
                    All games are powered by Arbitrum Stylus smart contracts that have been audited for
                    security. Your funds are safe, and payouts are automatic and immediate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
