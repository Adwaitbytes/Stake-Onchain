
import { Link } from "react-router-dom";
import { WalletConnect } from "@/components/ui/wallet-connect";
import { Button } from "@/components/ui/button";
import { Plus, BarChart, Home, Dices } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md bg-background/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="font-space text-xl font-bold bg-gradient-to-r from-neural-light via-neural-highlight to-neural-glow bg-clip-text text-transparent">
              AIPredict
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center ml-8 space-x-1">
            <Link to="/">
              <Button variant="ghost" className="text-sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/markets">
              <Button variant="ghost" className="text-sm">
                <BarChart className="h-4 w-4 mr-2" />
                Explore
              </Button>
            </Link>
            <Link to="/games">
              <Button variant="ghost" className="text-sm">
                <Dices className="h-4 w-4 mr-2" />
                Games
              </Button>
            </Link>
            <Link to="/create">
              <Button variant="ghost" className="text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <WalletConnect />
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-white/10 p-2 z-50">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center py-1 px-3 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/markets" className="flex flex-col items-center py-1 px-3 text-muted-foreground hover:text-foreground transition-colors">
            <BarChart className="h-5 w-5" />
            <span className="text-xs mt-1">Explore</span>
          </Link>
          <Link to="/games" className="flex flex-col items-center py-1 px-3 text-muted-foreground hover:text-foreground transition-colors">
            <Dices className="h-5 w-5" />
            <span className="text-xs mt-1">Games</span>
          </Link>
          <Link to="/create" className="flex flex-col items-center py-1 px-3 text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1">Create</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
