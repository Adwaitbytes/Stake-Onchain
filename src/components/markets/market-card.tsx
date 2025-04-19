
import { Link } from "react-router-dom";
import { Market } from "@/types/market";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface MarketCardProps {
  market: Market;
  aiPrediction?: {
    yesPercentage: number;
    noPercentage: number;
  };
}

export function MarketCard({ market, aiPrediction }: MarketCardProps) {
  const isExpired = market.endTime < Date.now();
  const totalBets = market.totalYesBets + market.totalNoBets;
  
  return (
    <Link 
      to={`/market/${market.id}`}
      className="block"
    >
      <div className="glass-card rounded-xl p-5 h-full hover:scale-[1.02] transition-transform duration-300 neural-glow">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold line-clamp-2">{market.title}</h3>
          <MarketStatus market={market} />
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{market.description}</p>
        
        {/* AI Prediction when available */}
        {aiPrediction && (
          <div className="mb-4 p-3 rounded-lg bg-neural-dark/40 border border-neural-accent/30">
            <div className="text-xs text-muted-foreground mb-1">AI Prediction</div>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs text-green-400">Yes</div>
                <div className="font-semibold">{aiPrediction.yesPercentage}%</div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-red-400">No</div>
                <div className="font-semibold">{aiPrediction.noPercentage}%</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {market.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs bg-neural-dark/40">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-muted-foreground">Total pool</div>
            <div className="font-semibold">{totalBets.toFixed(2)} ETH</div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {isExpired ? 'Ended' : 'Ends'} {formatDistanceToNow(market.endTime, { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MarketStatus({ market }: { market: Market }) {
  if (market.resolved) {
    return (
      <Badge className={market.result ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}>
        {market.result ? "Yes" : "No"}
      </Badge>
    );
  }
  
  if (market.endTime < Date.now()) {
    return <Badge variant="outline">Expired</Badge>;
  }
  
  return <Badge variant="outline" className="bg-neural-accent/20 text-neural-light">Active</Badge>;
}
