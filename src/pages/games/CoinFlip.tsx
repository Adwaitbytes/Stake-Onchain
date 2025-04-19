import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getWalletStatus } from "@/services/arbitrumService";
import { playGame, getUserGameHistory, getUserGameStats } from "@/services/gameService";
import { GameResult, GameStats } from "@/types/games";
import { ArrowLeft, CoinsIcon, History, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function CoinFlip() {
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showingResult, setShowingResult] = useState(false);
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
    
    if (window.ethereum) {
      const handleAccountsChanged = () => {
        fetchWallet();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);
  
  useEffect(() => {
    if (wallet.connected) {
      loadGameHistory();
      loadGameStats();
    }
  }, [wallet.connected]);
  
  const loadGameHistory = async () => {
    try {
      const history = await getUserGameHistory("coinflip");
      setGameHistory(history);
    } catch (error) {
      console.error("Failed to load game history:", error);
    }
  };
  
  const loadGameStats = async () => {
    try {
      const gameStats = await getUserGameStats("coinflip");
      setStats(gameStats);
    } catch (error) {
      console.error("Failed to load game stats:", error);
    }
  };
  
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };
  
  const handleSelectSide = (side: "heads" | "tails") => {
    setSelectedSide(side);
  };
  
  const handlePlayGame = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet to play");
      return;
    }
    
    if (!selectedSide) {
      toast.error("Please select heads or tails");
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }
    
    if (amount > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }
    
    setIsPlaying(true);
    
    try {
      setShowingResult(true);
      setTimeout(async () => {
        try {
          const result = await playGame("coinflip", amount, selectedSide);
          setGameResult(result);
          
          loadGameHistory();
          loadGameStats();
          
          const walletStatus = await getWalletStatus();
          setWallet(walletStatus);
          
          if (result.won) {
            toast.success(`You won ${result.payout.toFixed(2)} ETH!`);
          } else {
            toast.error(`You lost ${amount.toFixed(2)} ETH`);
          }
          
          setTimeout(() => {
            setShowingResult(false);
            setGameResult(null);
            setBetAmount("");
            setSelectedSide(null);
            setIsPlaying(false);
          }, 3000);
        } catch (error: any) {
          console.error("Transaction failed:", error);
          toast.error(error.message || "Transaction failed. Please try again.");
          setShowingResult(false);
          setIsPlaying(false);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Failed to play game:", error);
      toast.error(error.message || "Failed to play game. Please try again.");
      setIsPlaying(false);
      setShowingResult(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <Link to="/games" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Coin Flip</h1>
          <p className="text-muted-foreground mb-8">Flip a coin and double your stake with 1.95x payout</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="glass-card rounded-xl p-6">
                {showingResult ? (
                  <div className="text-center py-8">
                    <div className={`text-5xl mb-6 mx-auto rounded-full w-24 h-24 flex items-center justify-center ${
                      gameResult?.won ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {gameResult?.won ? <Check className="h-12 w-12" /> : <X className="h-12 w-12" />}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">
                      {gameResult?.won ? 'You Won!' : 'You Lost'}
                    </h2>
                    
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground">Result</div>
                      <div className="text-xl font-semibold uppercase">
                        {gameResult?.outcome}
                      </div>
                    </div>
                    
                    {gameResult?.won && (
                      <div className="text-green-400 text-xl font-bold">
                        +{gameResult.payout.toFixed(2)} ETH
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center mb-6">
                      <CoinsIcon className="h-20 w-20 text-yellow-400" />
                    </div>
                    
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold mb-4">Choose Your Side</h2>
                      <div className="flex gap-4 justify-center">
                        <Button
                          size="lg"
                          variant={selectedSide === "heads" ? "default" : "outline"}
                          className={selectedSide === "heads" ? "bg-neural-accent" : ""}
                          onClick={() => handleSelectSide("heads")}
                          disabled={isPlaying}
                        >
                          Heads
                        </Button>
                        
                        <Button
                          size="lg"
                          variant={selectedSide === "tails" ? "default" : "outline"}
                          className={selectedSide === "tails" ? "bg-neural-accent" : ""}
                          onClick={() => handleSelectSide("tails")}
                          disabled={isPlaying}
                        >
                          Tails
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Bet Amount (ETH)</label>
                        <div className="flex">
                          <Input
                            type="text"
                            value={betAmount}
                            onChange={handleBetAmountChange}
                            placeholder="0.1"
                            className="rounded-r-none"
                            disabled={isPlaying}
                          />
                          <Button 
                            variant="outline" 
                            className="rounded-l-none"
                            onClick={() => setBetAmount(wallet.balance.toString())}
                            disabled={isPlaying || !wallet.connected}
                          >
                            Max
                          </Button>
                        </div>
                      </div>
                      
                      {betAmount && parseFloat(betAmount) > 0 && (
                        <div className="text-sm text-green-400">
                          Potential Win: {(parseFloat(betAmount) * 1.95).toFixed(2)} ETH (1.95x)
                        </div>
                      )}
                      
                      <Button
                        className="w-full bg-neural-accent hover:bg-neural-accent/90"
                        size="lg"
                        onClick={handlePlayGame}
                        disabled={
                          isPlaying ||
                          !wallet.connected ||
                          !selectedSide ||
                          !betAmount ||
                          parseFloat(betAmount) <= 0 ||
                          parseFloat(betAmount) > wallet.balance
                        }
                      >
                        {isPlaying ? "Flipping Coin..." : "Flip Coin"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {gameHistory.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <History className="h-5 w-5 mr-2 text-neural-light" />
                    <h2 className="text-xl font-semibold">Recent Games</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {gameHistory.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 rounded-lg glass-card">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            game.won ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {game.won ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              Bet {game.stake.toFixed(2)} ETH on {game.playerChoice}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(game.timestamp, { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className={game.won ? 'text-green-400' : 'text-red-400'}>
                          {game.won ? `+${game.payout.toFixed(2)}` : `-${game.stake.toFixed(2)}`} ETH
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {wallet.connected ? (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
                  
                  {stats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Games Played</div>
                          <div className="font-semibold">{stats.totalGames}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                          <div className="font-semibold">{stats.winRate.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Total Wagered</div>
                        <div className="font-semibold">{stats.totalWagered.toFixed(2)} ETH</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Total Payouts</div>
                        <div className="font-semibold">{stats.totalPayout.toFixed(2)} ETH</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Net Profit/Loss</div>
                        <div className={`font-semibold ${
                          stats.totalPayout - stats.totalWagered >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {stats.totalPayout - stats.totalWagered >= 0 ? '+' : ''}
                          {(stats.totalPayout - stats.totalWagered).toFixed(2)} ETH
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No stats available yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-neural-light opacity-70" />
                  <h2 className="text-xl font-semibold mb-2">Connect Wallet to Play</h2>
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to start playing and track your stats.
                  </p>
                </div>
              )}
              
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">How to Play</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">1. Select a Side</h3>
                    <p className="text-sm text-muted-foreground">Choose whether the coin will land on heads or tails.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">2. Enter Your Bet</h3>
                    <p className="text-sm text-muted-foreground">Enter the amount of ETH you want to wager on this flip.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">3. Flip the Coin</h3>
                    <p className="text-sm text-muted-foreground">If your prediction is correct, you win 1.95x your bet amount!</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Game Rules</h2>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Fair 50/50 chance of heads or tails</p>
                  <p>• 2.5% house edge</p>
                  <p>• 1.95x payout for winning bets</p>
                  <p>• Minimum bet: 0.001 ETH</p>
                  <p>• Maximum bet: 5 ETH</p>
                  <p>• Results are provably fair and verifiable on-chain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
