
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MarketCard } from "@/components/markets/market-card";
import { getMarkets } from "@/services/mockBlockchainService";
import { Market } from "@/types/market";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

// Predefined categories/tags for filtering
const CATEGORIES = ["Crypto", "Sports", "Politics", "Technology", "Entertainment", "Finance"];

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const allMarkets = await getMarkets();
        // Sort by creation date, newest first
        allMarkets.sort((a, b) => b.createdAt - a.createdAt);
        setMarkets(allMarkets);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarkets();
  }, []);
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const filteredMarkets = markets.filter(market => {
    // Filter by search term
    const matchesSearch = searchTerm === "" || 
      market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => market.tags.includes(tag));
    
    // Filter by status
    const matchesStatus = showResolved || !market.resolved;
    
    return matchesSearch && matchesTags && matchesStatus;
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Explore Markets</h1>
          
          {/* Search and filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search markets..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedTags.includes(tag) 
                      ? "bg-neural-accent hover:bg-neural-accent/80" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                className={showResolved ? "text-neural-light" : "text-muted-foreground"}
                onClick={() => setShowResolved(!showResolved)}
              >
                {showResolved ? "✓ Show Resolved" : "Show Resolved"}
              </Button>
            </div>
          </div>
          
          {/* Markets grid */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
          ) : filteredMarkets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
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
              <p className="text-xl mb-2">No markets found</p>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search term</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedTags([]);
                setShowResolved(false);
              }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
