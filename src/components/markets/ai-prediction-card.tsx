
import { useEffect, useState } from "react";
import { getAIPrediction } from "@/services/aiPredictionService";
import { AIPrediction } from "@/types/market";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

interface AIPredictionCardProps {
  marketId: string;
  question: string;
}

export function AIPredictionCard({ marketId, question }: AIPredictionCardProps) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const data = await getAIPrediction(marketId, question);
        setPrediction(data);
      } catch (error) {
        console.error("Failed to get AI prediction:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrediction();
  }, [marketId, question]);
  
  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="h-5 w-48 bg-muted-foreground/20 rounded"></div>
        </h3>
        <div className="space-y-4">
          <div className="h-4 w-full bg-muted-foreground/20 rounded"></div>
          <div className="h-10 w-full bg-muted-foreground/20 rounded"></div>
          <div className="h-4 w-3/4 bg-muted-foreground/20 rounded"></div>
          <div className="h-4 w-5/6 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!prediction) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">AI Prediction Unavailable</h3>
        <p className="text-muted-foreground">Unable to generate prediction for this market.</p>
      </div>
    );
  }
  
  return (
    <div className="glass-card rounded-xl p-6 border border-neural-accent/30">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="ai-gradient-text">AI Prediction</span>
        <span className="text-xs font-normal text-muted-foreground">
          {Math.round(prediction.confidence * 100)}% confidence
        </span>
      </h3>
      
      <div className="grid gap-4 mb-6">
        {/* Yes prediction */}
        <div>
          <div className="flex justify-between mb-1">
            <div className="text-sm font-medium text-green-400">Yes</div>
            <div className="text-sm font-medium">{prediction.yesPercentage}%</div>
          </div>
          <Progress className="h-2" value={prediction.yesPercentage} />
        </div>
        
        {/* No prediction */}
        <div>
          <div className="flex justify-between mb-1">
            <div className="text-sm font-medium text-red-400">No</div>
            <div className="text-sm font-medium">{prediction.noPercentage}%</div>
          </div>
          <Progress className="h-2 bg-muted" value={prediction.noPercentage} />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-neural-light mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-neural-light">Key factors in this prediction:</p>
            <ul className="list-disc pl-5 mt-2 text-muted-foreground space-y-1">
              {prediction.factors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
