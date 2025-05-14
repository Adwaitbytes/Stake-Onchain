import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { AIPredictionCard } from "@/components/markets/ai-prediction-card";
import {
  getMarket,
  getWalletStatus,
  getUserBets,
  placeBet,
  resolveMarket,
  claimWinnings,
} from "@/services/mockBlockchainService";
import { Market, UserBet } from "@/types/market";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Check, AlertCircle, Clock } from "lucide-react";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState("");
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const marketData = await getMarket(id);
        if (marketData) {
          setMarket(marketData);
          
          // Get user bets for this market
          const bets = await getUserBets(id);
          setUserBets(bets);
        }
      } catch (error) {
        console.error("Failed to fetch market:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
  }, [id]);
  
  const walletStatus = getWalletStatus();
  const isUserMarketCreator = market && walletStatus.connected && market.creator === walletStatus.address;
  const isExpired = market && market.endTime < Date.now();
  const isResolved = market?.resolved;
  
  const totalYesBets = market?.totalYesBets || 0;
  const totalNoBets = market?.totalNoBets || 0;
  const totalPool = totalYesBets + totalNoBets;
  
  const yesPercentage = totalPool === 0 ? 50 : Math.round((totalYesBets / totalPool) * 100);
  const noPercentage = totalPool === 0 ? 50 : Math.round((totalNoBets / totalPool) * 100);
  
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Only allow numbers and a decimal point
      setBetAmount(value);
    }
  };
  
  const handlePlaceBet = async () => {
    setError("");
    setSuccessMessage("");
    
    if (!market) return;
    if (!walletStatus.connected) {
      setError("Please connect your wallet to place a bet");
      return;
    }
    if (!betSide) {
      setError("Please select Yes or No");
      return;
    }
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError("Please enter a valid bet amount");
      return;
    }
    if (parseFloat(betAmount) > walletStatus.balance) {
      setError("Insufficient balance");
      return;
    }
    
    setIsPlacingBet(true);
    try {
      await placeBet(
        market.id,
        parseFloat(betAmount),
        betSide === "yes"
      );
      
      // Refresh market and user bets
      const updatedMarket = await getMarket(market.id);
      if (updatedMarket) {
        setMarket(updatedMarket);
      }
      
      const updatedBets = await getUserBets(market.id);
      setUserBets(updatedBets);
      
      setSuccessMessage(`Successfully placed a ${betAmount} SOL bet on ${betSide.toUpperCase()}`);
      
      // Reset form
      setBetAmount("");
      setBetSide(null);
    } catch (error) {
      console.error("Failed to place bet:", error);
      setError("Failed to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  };
  
  const handleResolveMarket = async (result: boolean) => {
    if (!market || !id) return;
    
    setIsResolving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      await resolveMarket(id, result);
      
      // Refresh market data
      const updatedMarket = await getMarket(id);
      if (updatedMarket) {
        setMarket(updatedMarket);
      }
      
      setSuccessMessage(`Market resolved as ${result ? "YES" : "NO"}`);
    } catch (error) {
      console.error("Failed to resolve market:", error);
      setError("Failed to resolve market. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };
  
  const handleClaimWinnings = async () => {
    if (!market || !id) return;
    
    setIsClaiming(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const result = await claimWinnings(id);
      
      if (result.claimed) {
        // Refresh user bets
        const updatedBets = await getUserBets(id);
        setUserBets(updatedBets);
        
        setSuccessMessage(`Successfully claimed ${result.amount.toFixed(2)} SOL`);
      } else {
        setError("No winnings to claim");
      }
    } catch (error) {
      console.error("Failed to claim winnings:", error);
      setError("Failed to claim winnings. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };
  
  const userHasUnclaimedWinnings = () => {
    if (!market || !market.resolved) return false;
    
    return userBets.some(bet => 
      !bet.claimed && bet.prediction === market.result
    );
  };
  
  const getUserBetTotal = (side: boolean) => {
    return userBets
      .filter(bet => bet.prediction === side)
      .reduce((sum, bet) => sum + bet.amount, 0);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted-foreground/20 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-muted-foreground/20 rounded w-3/4 mb-6"></div>
              <div className="glass-card rounded-xl p-6 mb-6">
                <div className="h-6 bg-muted-foreground/20 rounded w-full mb-4"></div>
                <div className="h-6 bg-muted-foreground/20 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-muted-foreground/20 rounded w-full mb-6"></div>
                <div className="h-6 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!market) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-20 pb-20 md:pb-0">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-semibold mb-4">Market not found</h1>
            <p className="text-muted-foreground mb-6">The market you're looking for doesn't exist or has been removed.</p>
            <Link to="/markets">
              <Button>Browse Markets</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <Link to="/markets" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Markets
          </Link>
          
          {/* Market status banner */}
          {market.resolved && (
            <div className={`glass-card rounded-xl p-4 mb-6 flex items-center ${
              market.result ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
            }`}>
              <div className="mr-3">
                {market.result ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Market Resolved</h3>
                <p className="text-sm">
                  This market was resolved as <strong>{market.result ? "YES" : "NO"}</strong>
                </p>
              </div>
            </div>
          )}
          
          {isExpired && !market.resolved && (
            <div className="glass-card rounded-xl p-4 mb-6 flex items-center border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
              <div>
                <h3 className="font-semibold">Market Expired</h3>
                <p className="text-sm">
                  This market has ended but hasn't been resolved yet.
                </p>
              </div>
            </div>
          )}
          
          {/* Market header */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {market.tags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-neural-dark/40">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{market.title}</h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {market.resolved ? 'Ended' : 'Ends'} {formatDistanceToNow(market.endTime, { addSuffix: true })}
                <span className="text-xs ml-1">({format(market.endTime, "PPp")})</span>
              </div>
              <div>
                Created {formatDistanceToNow(market.createdAt, { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Market description */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="whitespace-pre-line">{market.description}</p>
              </div>
              
              {/* Current market stats */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Market Statistics</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Yes Pool</div>
                    <div className="text-2xl font-semibold">{totalYesBets.toFixed(2)} SOL</div>
                    <div className="text-sm font-medium text-green-400">{yesPercentage}%</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">No Pool</div>
                    <div className="text-2xl font-semibold">{totalNoBets.toFixed(2)} SOL</div>
                    <div className="text-sm font-medium text-red-400">{noPercentage}%</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Pool</div>
                    <div className="text-2xl font-semibold">{totalPool.toFixed(2)} SOL</div>
                  </div>
                </div>
              </div>
              
              {/* User bets section */}
              {walletStatus.connected && userBets.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Bets</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Your Yes Bets</div>
                      <div className="text-2xl font-semibold">{getUserBetTotal(true).toFixed(2)} SOL</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Your No Bets</div>
                      <div className="text-2xl font-semibold">{getUserBetTotal(false).toFixed(2)} SOL</div>
                    </div>
                  </div>
                  
                  {/* Claim winnings button */}
                  {market.resolved && userHasUnclaimedWinnings() && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={handleClaimWinnings}
                      disabled={isClaiming}
                    >
                      {isClaiming ? "Claiming..." : "Claim Winnings"}
                      {!isClaiming && <Check className="ml-2 h-4 w-4" />}
                    </Button>
                  )}
                  
                  {/* If user bet on the wrong outcome */}
                  {market.resolved && !userHasUnclaimedWinnings() && userBets.length > 0 && (
                    <div className="text-center text-muted-foreground p-2">
                      {market.result ? 
                        "You bet on NO and the outcome was YES." : 
                        "You bet on YES and the outcome was NO."
                      }
                    </div>
                  )}
                </div>
              )}
              
              {/* Market creator controls */}
              {isUserMarketCreator && isExpired && !isResolved && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Resolve Market</h2>
                  <p className="text-muted-foreground mb-4">As the creator of this market, you can resolve it now that it has expired.</p>
                  
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleResolveMarket(true)}
                      disabled={isResolving}
                    >
                      {isResolving ? "Resolving..." : "Resolve as YES"}
                    </Button>
                    
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleResolveMarket(false)}
                      disabled={isResolving}
                    >
                      {isResolving ? "Resolving..." : "Resolve as NO"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* AI Prediction */}
              <AIPredictionCard marketId={market.id} question={market.title} />
              
              {/* Place bet section */}
              {!market.resolved && !isExpired && (
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Place a Bet</h2>
                  
                  {!walletStatus.connected ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground mb-4">Connect your wallet to place a bet</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Your Balance</div>
                        <div className="text-lg font-semibold">{walletStatus.balance.toFixed(2)} SOL</div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm text-muted-foreground block mb-2">Bet Amount (SOL)</label>
                        <Input
                          type="text"
                          value={betAmount}
                          onChange={handleBetAmountChange}
                          placeholder="0.1"
                          className="mb-1"
                        />
                        <div className="flex justify-end">
                          <button 
                            type="button"
                            className="text-xs text-neural-light hover:text-neural-light/80"
                            onClick={() => setBetAmount(walletStatus.balance.toString())}
                          >
                            Max
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">Your Prediction</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={betSide === "yes" ? "default" : "outline"}
                            className={betSide === "yes" ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-500/10 hover:text-green-400"}
                            onClick={() => setBetSide("yes")}
                          >
                            Yes
                          </Button>
                          
                          <Button
                            variant={betSide === "no" ? "default" : "outline"}
                            className={betSide === "no" ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-500/10 hover:text-red-400"}
                            onClick={() => setBetSide("no")}
                          >
                            No
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        className="w-full neural-glow"
                        size="lg"
                        disabled={
                          isPlacingBet || 
                          !betSide || 
                          !betAmount || 
                          parseFloat(betAmount) <= 0 ||
                          parseFloat(betAmount) > walletStatus.balance
                        }
                        onClick={handlePlaceBet}
                      >
                        {isPlacingBet ? "Placing Bet..." : "Place Bet"}
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Error and success messages */}
              {error && (
                <div className="glass-card rounded-xl p-4 border border-red-500/50 bg-red-500/10">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="glass-card rounded-xl p-4 border border-green-500/50 bg-green-500/10">
                  <p className="text-green-400">{successMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
