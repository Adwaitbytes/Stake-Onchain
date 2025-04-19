
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getWalletStatus } from "@/services/mockBlockchainService";
import { playGame, getUserGameHistory, getUserGameStats } from "@/services/gameService";
import { GameResult, GameStats } from "@/types/games";
import { ArrowLeft, History, Check, X, AlertCircle, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Map dice number to icon component
const diceIcons = {
  "1": Dice1,
  "2": Dice2,
  "3": Dice3,
  "4": Dice4,
  "5": Dice5,
  "6": Dice6
};

export default function Dice() {
  const [betAmount, setBetAmount] = useState<string>("");
  const [selectedDice, setSelectedDice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  
  const wallet = getWalletStatus();
  const isConnected = wallet.connected;
  
  useEffect(() => {
    if (isConnected) {
      loadGameHistory();
      loadGameStats();
    }
  }, [isConnected]);
  
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
      const gameStats = await getUserGameStats("dice");
      setStats(gameStats);
    } catch (error) {
      console.error("Failed to load game stats:", error);
    }
  };
  
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Only allow numbers and a decimal point
      setBetAmount(value);
    }
  };
  
  const handleSelectDice = (dice: string) => {
    setSelectedDice(dice);
  };
  
  const handlePlayGame = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to play");
      return;
    }
    
    if (!selectedDice) {
      toast.error("Please select a dice number");
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
      // Dice rolling animation before showing result
      setShowingResult(true);
      // Wait for animation to complete before processing result
      setTimeout(async () => {
        const result = await playGame("dice", amount, selectedDice);
        setGameResult(result);
        
        // Refresh history and stats
        loadGameHistory();
        loadGameStats();
        
        // Show result notification
        if (result.won) {
          toast.success(`You won ${result.payout.toFixed(2)} ETH!`);
        } else {
          toast.error(`You lost ${amount.toFixed(2)} ETH`);
        }
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setShowingResult(false);
          setGameResult(null);
          setBetAmount("");
          setSelectedDice(null);
          setIsPlaying(false);
        }, 3000);
      }, 2000);
    } catch (error) {
      console.error("Failed to play game:", error);
      toast.error("Failed to play game. Please try again.");
      setIsPlaying(false);
      setShowingResult(false);
    }
  };
  
  // Render the dice icon based on the number
  const renderDiceIcon = (number: string, size: number = 24) => {
    const DiceIcon = diceIcons[number as keyof typeof diceIcons];
    return DiceIcon ? <DiceIcon size={size} /> : null;
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
          
          <h1 className="text-3xl font-bold mb-2">Dice Roll</h1>
          <p className="text-muted-foreground mb-8">Predict the dice roll outcome and win 5.7x your stake</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Game section */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass-card rounded-xl p-6">
                {showingResult ? (
                  // Result display
                  <div className="text-center py-8">
                    <div className={`text-5xl mb-6 mx-auto rounded-full w-24 h-24 flex items-center justify-center ${
                      gameResult?.won ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {gameResult?.outcome && renderDiceIcon(gameResult.outcome, 64)}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">
                      {gameResult?.won ? 'You Won!' : 'You Lost'}
                    </h2>
                    
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground">Dice Rolled</div>
                      <div className="text-xl font-semibold">
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
                  // Game interface
                  <div>
                    <div className="flex justify-center mb-6">
                      <div className="h-20 w-20 flex items-center justify-center bg-neural-accent/20 rounded-xl text-neural-light">
                        {selectedDice ? 
                          renderDiceIcon(selectedDice, 64) : 
                          <Dice6 size={64} className="opacity-40" />
                        }
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold mb-4">Predict the Dice Roll</h2>
                      <div className="grid grid-cols-6 gap-2">
                        {["1", "2", "3", "4", "5", "6"].map((dice) => (
                          <Button
                            key={dice}
                            variant={selectedDice === dice ? "default" : "outline"}
                            className={`aspect-square p-0 ${selectedDice === dice ? "bg-neural-accent" : ""}`}
                            onClick={() => handleSelectDice(dice)}
                            disabled={isPlaying}
                          >
                            {renderDiceIcon(dice)}
                          </Button>
                        ))}
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
                            disabled={isPlaying || !isConnected}
                          >
                            Max
                          </Button>
                        </div>
                      </div>
                      
                      {betAmount && parseFloat(betAmount) > 0 && (
                        <div className="text-sm text-green-400">
                          Potential Win: {(parseFloat(betAmount) * 5.7).toFixed(2)} ETH (5.7x)
                        </div>
                      )}
                      
                      <Button
                        className="w-full bg-neural-accent hover:bg-neural-accent/90"
                        size="lg"
                        onClick={handlePlayGame}
                        disabled={
                          isPlaying ||
                          !isConnected ||
                          !selectedDice ||
                          !betAmount ||
                          parseFloat(betAmount) <= 0 ||
                          parseFloat(betAmount) > wallet.balance
                        }
                      >
                        {isPlaying ? "Rolling Dice..." : "Roll Dice"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Recent games */}
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
                        <div className="flex items-center">
                          <div className="mr-3">
                            Rolled: {renderDiceIcon(game.outcome)}
                          </div>
                          <div className={game.won ? 'text-green-400' : 'text-red-400'}>
                            {game.won ? `+${game.payout.toFixed(2)}` : `-${game.stake.toFixed(2)}`} ETH
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Info section */}
            <div className="space-y-6">
              {isConnected ? (
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
                    <h3 className="font-medium mb-1">1. Select a Number</h3>
                    <p className="text-sm text-muted-foreground">Choose which number (1-6) you think the dice will land on.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">2. Enter Your Bet</h3>
                    <p className="text-sm text-muted-foreground">Enter the amount of ETH you want to wager on this roll.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">3. Roll the Dice</h3>
                    <p className="text-sm text-muted-foreground">If your prediction is correct, you win 5.7x your bet amount!</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Game Rules</h2>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• Equal 1/6 chance for each number</p>
                  <p>• 5% house edge</p>
                  <p>• 5.7x payout for winning bets</p>
                  <p>• Minimum bet: 0.001 ETH</p>
                  <p>• Maximum bet: 3 ETH</p>
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
