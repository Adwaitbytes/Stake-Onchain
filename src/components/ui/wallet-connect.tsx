import { useState, useEffect } from "react";
import { connectWallet, disconnectWallet, getWalletStatus, isPhantomInstalled, updateWalletBalance } from "@/services/solanaService";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: "",
    balance: 0,
    isConnecting: false,
    testMode: false
  });

  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        // Check if Phantom is installed
        const phantomInstalled = isPhantomInstalled();
        
        if (!phantomInstalled) {
          setWalletState(prev => ({
            ...prev,
            testMode: true
          }));
          console.log("Phantom wallet not detected, using test mode");
        }
        
        // Update balance from blockchain first
        if (phantomInstalled && window.solana?.isConnected) {
          await updateWalletBalance();
        }
        
        const status = getWalletStatus();
        setWalletState(prev => ({
          ...prev,
          connected: status.connected,
          address: status.address,
          balance: status.balance,
          testMode: !phantomInstalled && status.connected
        }));
      } catch (error) {
        console.error("Failed to get wallet status:", error);
      }
    };
    
    checkWalletStatus();
    
    // Set up event listeners for wallet changes
    if (window.solana) {
      const handleAccountsChanged = async () => {
        // Account changed, update state
        await checkWalletStatus();
      };
      
      window.solana.on('accountChanged', handleAccountsChanged);
      
      // Set up an interval to check wallet status periodically
      // This ensures the UI stays in sync with the actual wallet balance
      const intervalId = setInterval(checkWalletStatus, 2000);
      
      return () => {
        window.solana?.removeListener('accountChanged', handleAccountsChanged);
        clearInterval(intervalId);
      };
    }
    
    // For test mode, set up periodic balance checks
    const intervalId = setInterval(checkWalletStatus, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    try {
      const phantomInstalled = isPhantomInstalled();
      
      if (!phantomInstalled) {
        // If Phantom is not installed, prompt to install
        toast.info("Phantom wallet not detected", {
          description: (
            <div className="flex flex-col gap-2">
              <div>Please install Phantom wallet to continue</div>
              <a 
                href="https://phantom.app/download" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-neural-accent hover:underline"
              >
                Install Phantom <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          ),
          duration: 5000
        });
        setWalletState(prev => ({ ...prev, isConnecting: false }));
        return;
      }
      
      // Check if Phantom is on the correct network (Devnet)
      if (window.solana) {
        try {
          // Connect to wallet
          const { address, balance } = await connectWallet();
          
          setWalletState({
            connected: true,
            address,
            balance,
            isConnecting: false,
            testMode: false
          });
          
          toast.success("Wallet connected successfully", {
            description: "Connected to Solana Devnet"
          });
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          toast.error("Failed to connect wallet", {
            description: "Please make sure Phantom wallet is unlocked and set to Solana Devnet"
          });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet. Please make sure Phantom wallet is installed and unlocked.");
    } finally {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setWalletState({
        connected: false,
        address: "",
        balance: 0,
        isConnecting: false,
        testMode: false
      });
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={className}>
      {walletState.connected ? (
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Devnet
          </Badge>
          <div className="hidden md:block">
            <div className="text-sm text-gray-400">
              Balance: <span className="font-medium text-neural-light">{walletState.balance.toFixed(4)} SOL</span>
            </div>
            <div className="text-sm font-medium truncate">{formatAddress(walletState.address)}</div>
          </div>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="neural-glow"
          >
            <Wallet className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Disconnect</span>
            <span className="md:hidden">Wallet</span>
          </Button>
        </div>
      ) : (
        <Button
          variant="default"
          onClick={handleConnect}
          disabled={walletState.isConnecting}
          className="bg-neural-accent hover:bg-neural-accent/90 transition-all neural-glow"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {walletState.isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}
    </div>
  );
}
