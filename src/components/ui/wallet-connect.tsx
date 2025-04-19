
import { useState, useEffect } from "react";
import { connectWallet, disconnectWallet, getWalletStatus, isMetaMaskInstalled } from "@/services/arbitrumService";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
    const checkWalletStatus = () => {
      try {
        // Check if MetaMask is installed
        const metaMaskInstalled = isMetaMaskInstalled();
        
        if (!metaMaskInstalled) {
          setWalletState(prev => ({
            ...prev,
            testMode: true
          }));
          console.log("MetaMask not detected, using test mode");
        }
        
        const status = getWalletStatus();
        setWalletState(prev => ({
          ...prev,
          connected: status.connected,
          address: status.address,
          balance: status.balance,
          testMode: !metaMaskInstalled && status.connected
        }));
      } catch (error) {
        console.error("Failed to get wallet status:", error);
      }
    };
    
    checkWalletStatus();
    
    // Set up event listeners for wallet changes
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          await handleDisconnect();
        } else {
          // Account changed, update state
          checkWalletStatus();
        }
      };
      
      const handleChainChanged = () => {
        // Chain changed, refresh the page
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Set up an interval to check wallet status periodically
      // This ensures the UI stays in sync with the actual wallet balance
      const intervalId = setInterval(checkWalletStatus, 2000);
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
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
      const metaMaskInstalled = isMetaMaskInstalled();
      
      if (!metaMaskInstalled) {
        // If MetaMask is not installed, use test mode or prompt to install
        toast.info("MetaMask not detected", {
          description: (
            <div className="flex flex-col gap-2">
              <div>Using test mode for demonstration</div>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-neural-accent hover:underline"
              >
                Install MetaMask <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          ),
          duration: 5000
        });
      }
      
      const { address, balance } = await connectWallet();
      setWalletState({
        connected: true,
        address,
        balance,
        isConnecting: false,
        testMode: !metaMaskInstalled 
      });
      
      if (metaMaskInstalled) {
        toast.success("Wallet connected successfully");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.");
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
          {walletState.testMode && (
            <div className="items-center hidden md:flex">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-xs text-yellow-500">Test Mode</span>
            </div>
          )}
          <div className="hidden md:block">
            <div className="text-sm text-gray-400">
              Balance: <span className="font-medium text-neural-light">{walletState.balance.toFixed(2)} ETH</span>
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
