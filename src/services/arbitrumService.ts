
// This service handles interactions with the Arbitrum Stylus blockchain

// Mock wallet state
let walletState = {
  connected: false,
  address: "",
  balance: 0
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return window.ethereum !== undefined;
};

// Initialize blockchain connection
export const initBlockchain = async () => {
  console.log("Initializing blockchain connection...");
  
  // For demo purposes, we'll start with a connected wallet
  if (process.env.NODE_ENV === 'development') {
    walletState = {
      connected: true,
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      balance: 10.0 // 10 ETH for testing
    };
  }
  
  return walletState;
};

// Connect wallet
export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to use this application.");
    }
    
    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length === 0) {
      throw new Error("No accounts found. Please unlock your MetaMask wallet.");
    }
    
    // Get balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });
    
    // Convert from wei to ETH
    const balanceInEth = parseInt(balance, 16) / 1e18;
    
    walletState = {
      connected: true,
      address: accounts[0],
      balance: balanceInEth
    };
    
    return walletState;
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    
    // For demo purposes, set a mock wallet in development
    if (process.env.NODE_ENV === 'development') {
      walletState = {
        connected: true,
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        balance: 10.0 // 10 ETH for testing
      };
      return walletState;
    }
    
    throw error;
  }
};

// Get wallet status
export const getWalletStatus = async () => {
  // If already connected, return current state
  if (walletState.connected) {
    return walletState;
  }
  
  try {
    // Try to connect
    return await connectWallet();
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    
    // For demo purposes, set a mock wallet in development
    if (process.env.NODE_ENV === 'development') {
      walletState = {
        connected: true,
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        balance: 10.0 // 10 ETH for testing
      };
      return walletState;
    }
    
    return {
      connected: false,
      address: "",
      balance: 0
    };
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  walletState = {
    connected: false,
    address: "",
    balance: 0
  };
  
  return walletState;
};

// Other blockchain methods would go here...
