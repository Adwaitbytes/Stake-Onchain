import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getWalletStatus } from "@/services/solanaService";
import { playGame, getUserGameHistory, getUserGameStats } from "@/services/gameService";
import { GameResult, GameStats } from "@/types/games";
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, History, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Dice() {
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
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
      const history = await getUserGameHistory("dice");
      setGameHistory(history);
    } catch (error) {
      console.error("Failed to load game history:", error);
    }
  };
  
  const loadGameStats = async () => {
    try {
      const userStats = await getUserGameStats();
      setStats(userStats);
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
  
  const getDiceIcon = (number: number) => {
    switch (number) {
      case 1: return <Dice1 className="h-full w-full" />;
      case 2: return <Dice2 className="h-full w-full" />;
      case 3: return <Dice3 className="h-full w-full" />;
      case 4: return <Dice4 className="h-full w-full" />;
      case 5: return <Dice5 className="h-full w-full" />;
      case 6: return <Dice6 className="h-full w-full" />;
      default: return <Dice1 className="h-full w-full" />;
    }
  };
  
  const handlePlay = async () => {
    if (selectedNumber === null) {
      toast.error("Please select a number");
      return;
    }
    
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }
    
    if (!wallet.connected) {
      toast.error("Please connect your wallet to play");
      return;
    }
    
    if (parseFloat(betAmount) > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }
    
    setIsPlaying(true);
    setGameResult(null);
    setShowingResult(false);
    
    try {
      toast.info("Confirming transaction...", { duration: 3000 });
      
      const result = await playGame({
        gameType: "dice",
        betAmount: parseFloat(betAmount),
        prediction: selectedNumber
      });
      
      // Show loading animation before revealing result
      setTimeout(() => {
        setGameResult(result);
        setShowingResult(true);
        
        // Update game history and stats
        loadGameHistory();
        loadGameStats();
        
        if (result.won) {
          toast.success(`You won ${result.payout.toFixed(4)} SOL!`);
        } else {
          toast.error("Better luck next time!");
        }
      }, 2000);
      
    } catch (error) {
      console.error("Game error:", error);
      toast.error("Failed to play. Please try again.");
    } finally {
      setIsPlaying(false);
    }
  };
  
  const renderResultAnimation = () => {
    if (!gameResult) return null;
    
    if (!showingResult) {
      return (
        <div className="relative h-48 w-48 mx-auto mb-6">
          <div className="absolute inset-0 animate-spin">
            <div className="h-32 w-32 mx-auto text-neural-light">
              {getDiceIcon(Math.floor(Math.random() * 6) + 1)}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center mb-6">
        <div className="flex justify-center items-center h-48">
          <div className={`transform transition-all duration-700 ${gameResult.won ? 'scale-110' : 'scale-100'}`}>
            <div className="h-32 w-32 mx-auto text-neural-light">
              {getDiceIcon(gameResult.outcome)}
            </div>
            <div className="text-xl font-bold mt-2">Rolled {gameResult.outcome}</div>
          </div>
        </div>
        
        <div className={`mt-4 text-2xl font-bold ${gameResult.won ? 'text-green-500' : 'text-red-500'}`}>
          {gameResult.won ? (
            <div className="flex items-center justify-center">
              <Check className="mr-2" /> You Won {gameResult.payout.toFixed(4)} SOL!
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="mr-2" /> You Lost
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <Link to="/games" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Games
              </Link>
              <h1 className="text-3xl font-bold">Dice Roll</h1>
            </div>
            
            {wallet.connected && (
              <div className="mt-4 md:mt-0">
                <div className="glass-card rounded-lg p-3 text-sm">
                  <div className="text-muted-foreground mb-1">Your Balance</div>
                  <div className="text-xl font-semibold">{wallet.balance.toFixed(4)} SOL</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game controls section */}
            <div className="glass-card rounded-xl p-6 lg:col-span-2">
              {gameResult && showingResult ? (
                <>
                  {renderResultAnimation()}
                  
                  <div className="flex flex-col space-y-4">
                    <Button onClick={() => {
                      setGameResult(null);
                      setBetAmount("");
                      setSelectedNumber(null);
                    }}>
                      Play Again
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-6">Place Your Bet</h2>
                  
                  {isPlaying ? (
                    renderResultAnimation()
                  ) : (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Bet Amount (SOL)
                        </label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={betAmount}
                            onChange={handleBetAmountChange}
                            placeholder="0.01"
                            disabled={isPlaying}
                            className="pr-16"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-neural-light"
                            onClick={() => setBetAmount(wallet.balance.toString())}
                            disabled={isPlaying || !wallet.connected}
                          >
                            Max
                          </Button>
                        </div>
                        
                        {wallet.connected && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Potential win: {betAmount && parseFloat(betAmount) > 0 
                              ? (parseFloat(betAmount) * 5.7).toFixed(4) + " SOL" 
                              : "0.00 SOL"}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-8">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Pick a number
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {[1, 2, 3, 4, 5, 6].map((number) => (
                            <Button
                              key={number}
                              variant={selectedNumber === number ? "default" : "outline"}
                              className={`relative h-16 ${selectedNumber === number 
                                ? "bg-neural-accent hover:bg-neural-accent/90" 
                                : "hover:bg-neural-accent/20"}`}
                              onClick={() => setSelectedNumber(number)}
                              disabled={isPlaying}
                            >
                              <div className="h-8 w-8">
                                {getDiceIcon(number)}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        className="w-full bg-neural-accent hover:bg-neural-accent/90 neural-glow"
                        size="lg"
                        disabled={
                          isPlaying || 
                          selectedNumber === null || 
                          !betAmount || 
                          parseFloat(betAmount) <= 0 ||
                          !wallet.connected ||
                          (wallet.connected && parseFloat(betAmount) > wallet.balance)
                        }
                        onClick={handlePlay}
                      >
                        {isPlaying ? "Rolling..." : "Roll Dice"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Game info sidebar */}
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Game Rules</h2>
                <div className="space-y-3 text-sm">
                  <p>Pick a number from 1 to 6 and place your bet. If the dice rolls your number, you win 5.7 times your bet amount.</p>
                  
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span>Win Multiplier</span>
                    <span className="font-semibold text-green-400">5.7x</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span>House Edge</span>
                    <span>5%</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span>Min Bet</span>
                    <span>0.001 SOL</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span>Max Bet</span>
                    <span>5 SOL</span>
                  </div>
                </div>
              </div>
              
              {wallet.connected && stats && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>Games Played</span>
                      <span>{stats.totalGames}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>Win Rate</span>
                      <span>{stats.winRate.toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex justify-between py-2">
                      <span>Net Profit</span>
                      <span className={`font-semibold ${(stats.totalPayout - stats.totalWagered) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(stats.totalPayout - stats.totalWagered).toFixed(4)} SOL
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {!wallet.connected && (
                <div className="glass-card rounded-xl p-6">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2 text-neural-light opacity-70" />
                    <h2 className="text-lg font-semibold mb-2">Connect Wallet to Play</h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      Connect your wallet to start playing and track your stats.
                    </p>
                  </div>
                </div>
              )}
              
              {wallet.connected && gameHistory.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Games</h2>
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-3">
                    {gameHistory.slice(0, 5).map((game, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                        <div className="flex items-center">
                          {game.won ? (
                            <Check className="h-4 w-4 text-green-400 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-400 mr-2" />
                          )}
                          <div>
                            <div className="text-sm">Rolled {game.outcome}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(game.timestamp, { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                            {game.won ? `+${game.payout.toFixed(4)}` : `-${game.stake.toFixed(4)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">SOL</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
