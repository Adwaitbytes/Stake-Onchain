
import { useState, useEffect } from "react";
import { connectWallet, disconnectWallet, getWalletStatus } from "@/services/mockBlockchainService";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: "",
    balance: 0,
    isConnecting: false
  });

  useEffect(() => {
    const status = getWalletStatus();
    setWalletState(prev => ({
      ...prev,
      connected: status.connected,
      address: status.address,
      balance: status.balance
    }));
  }, []);

  const handleConnect = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    try {
      const { address, balance } = await connectWallet();
      setWalletState({
        connected: true,
        address,
        balance,
        isConnecting: false
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletState({
      connected: false,
      address: "",
      balance: 0,
      isConnecting: false
    });
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={className}>
      {walletState.connected ? (
        <div className="flex items-center gap-4">
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
