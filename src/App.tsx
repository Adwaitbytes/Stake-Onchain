import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initBlockchain } from "./services/solanaService";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import CreateMarket from "./pages/CreateMarket";
import MarketDetail from "./pages/MarketDetail";
import Games from "./pages/Games";
import CoinFlip from "./pages/games/CoinFlip";
import Dice from "./pages/games/Dice";
import SolanaInsights from "./pages/SolanaInsights";
import NotFound from "./pages/NotFound";
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize blockchain connection
    const initialize = async () => {
      try {
        await initBlockchain();
      } catch (error) {
        console.error("Failed to initialize blockchain:", error);
      }
    };
    
    initialize();
  }, []);
  
  return (
    <div>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/create" element={<CreateMarket />} />
            <Route path="/market/:id" element={<MarketDetail />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/coin-flip" element={<CoinFlip />} />
            <Route path="/games/dice" element={<Dice />} />
            <Route path="/solana-insights" element={<SolanaInsights />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    <Analytics />
    </div>
  );
};

export default App;
