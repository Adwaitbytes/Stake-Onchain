
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { createMarket, getWalletStatus } from "@/services/mockBlockchainService";
import { X, Plus, ArrowRight, Clock } from "lucide-react";
import { getAIPrediction } from "@/services/aiPredictionService";

// Predefined categories/tags for selection
const SUGGESTED_TAGS = ["Crypto", "Sports", "Politics", "Technology", "Entertainment", "Finance"];

export default function CreateMarket() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketData, setMarketData] = useState({
    title: "",
    description: "",
    endDate: "",
    endTime: "",
    tags: [] as string[],
    customTag: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiPrediction, setAiPrediction] = useState<null | {
    yesPercentage: number;
    noPercentage: number;
  }>(null);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMarketData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear AI prediction when title changes
    if (name === "title" || name === "description") {
      setAiPrediction(null);
    }
  };
  
  const addTag = (tag: string) => {
    if (!marketData.tags.includes(tag)) {
      setMarketData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };
  
  const removeTag = (tag: string) => {
    setMarketData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const handleAddCustomTag = () => {
    if (marketData.customTag.trim() && !marketData.tags.includes(marketData.customTag.trim())) {
      addTag(marketData.customTag.trim());
      setMarketData(prev => ({ ...prev, customTag: "" }));
    }
  };
  
  const getAIPredictionForMarket = async () => {
    if (!marketData.title.trim()) {
      setErrors(prev => ({ ...prev, title: "Title is required for AI prediction" }));
      return;
    }
    
    try {
      const prediction = await getAIPrediction(Date.now().toString(), marketData.title);
      setAiPrediction({
        yesPercentage: prediction.yesPercentage,
        noPercentage: prediction.noPercentage
      });
    } catch (error) {
      console.error("Failed to get AI prediction:", error);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!marketData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!marketData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    if (!marketData.endDate) {
      newErrors.endDate = "End date is required";
    }
    
    if (!marketData.endTime) {
      newErrors.endTime = "End time is required";
    }
    
    if (marketData.tags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }
    
    // Check if end date/time is in the future
    if (marketData.endDate && marketData.endTime) {
      const endTimestamp = new Date(`${marketData.endDate}T${marketData.endTime}`).getTime();
      if (endTimestamp <= Date.now()) {
        newErrors.endDate = "End date and time must be in the future";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if wallet is connected
    const wallet = getWalletStatus();
    if (!wallet.connected) {
      setErrors(prev => ({ ...prev, wallet: "Please connect your wallet first" }));
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time to get end timestamp
      const endTimestamp = new Date(`${marketData.endDate}T${marketData.endTime}`).getTime();
      
      const newMarket = await createMarket(
        marketData.title,
        marketData.description,
        endTimestamp,
        marketData.tags
      );
      
      // Navigate to the newly created market
      navigate(`/market/${newMarket.id}`);
    } catch (error) {
      console.error("Failed to create market:", error);
      setErrors(prev => ({ 
        ...prev, 
        submit: "Failed to create market. Please try again." 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Create a New Market</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Market Question</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Will BTC hit $100K by Dec 2025?"
                  value={marketData.title}
                  onChange={handleInputChange}
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide additional details about this prediction market..."
                  rows={4}
                  value={marketData.description}
                  onChange={handleInputChange}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">Resolution Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    min={today}
                    value={marketData.endDate}
                    onChange={handleInputChange}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm">{errors.endDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">Resolution Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={marketData.endTime}
                    onChange={handleInputChange}
                    className={errors.endTime ? "border-red-500" : ""}
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-sm">{errors.endTime}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {marketData.tags.map(tag => (
                    <Badge key={tag} className="bg-neural-accent/80 hover:bg-neural-accent/60 cursor-pointer flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 text-white hover:text-gray-200" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTED_TAGS.filter(tag => !marketData.tags.includes(tag)).map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-neural-accent/30"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex">
                  <Input
                    id="customTag"
                    name="customTag"
                    placeholder="Add custom tag..."
                    value={marketData.customTag}
                    onChange={handleInputChange}
                    className="rounded-r-none"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddCustomTag}
                    className="rounded-l-none"
                    disabled={!marketData.customTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {errors.tags && (
                  <p className="text-red-500 text-sm">{errors.tags}</p>
                )}
              </div>
            </div>
            
            {/* AI Prediction preview */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">AI Prediction</h2>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={getAIPredictionForMarket}
                  disabled={!marketData.title.trim() || isSubmitting}
                  className="text-neural-light"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Get Prediction
                </Button>
              </div>
              
              {aiPrediction ? (
                <div className="flex gap-8 mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-green-400">Yes</div>
                    <div className="text-2xl font-semibold">{aiPrediction.yesPercentage}%</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-red-400">No</div>
                    <div className="text-2xl font-semibold">{aiPrediction.noPercentage}%</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Click "Get Prediction" to see what the AI thinks about your market question.
                </p>
              )}
            </div>
            
            {errors.wallet && (
              <div className="glass-card rounded-xl p-4 border border-red-500/50 bg-red-500/10">
                <p className="text-red-400">{errors.wallet}</p>
              </div>
            )}
            
            {errors.submit && (
              <div className="glass-card rounded-xl p-4 border border-red-500/50 bg-red-500/10">
                <p className="text-red-400">{errors.submit}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-neural-accent hover:bg-neural-accent/90 neural-glow"
                size="lg"
              >
                {isSubmitting ? "Creating Market..." : "Create Market"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
