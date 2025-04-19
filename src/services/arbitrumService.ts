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
export const getWalletStatus = () => {
  // Return current state without async operation
  // This ensures we get the most up-to-date state for balance checks
  
  // For demo purposes in development, ensure wallet is initialized
  if (process.env.NODE_ENV === 'development' && !walletState.connected) {
    walletState = {
      connected: true,
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      balance: 10.0 // 10 ETH for testing
    };
  }
  
  return walletState;
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

// Update wallet balance (for game payouts/losses)
export const updateWalletBalance = (newBalance: number) => {
  walletState.balance = newBalance;
  return walletState;
};

// Simulate a blockchain transaction with MetaMask
export const sendTransaction = async (amount: number): Promise<string> => {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  try {
    // Get current account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      throw new Error("No accounts connected. Please connect your wallet first.");
    }
    
    // Convert amount from ETH to Wei (ETH * 10^18)
    const amountInWei = `0x${(amount * 1e18).toString(16)}`;
    
    // For test mode, just simulate the transaction
    if (process.env.NODE_ENV === 'development' && !isMetaMaskInstalled()) {
      // Simulate transaction in test mode
      console.log("Test mode: Simulating transaction of", amount, "ETH");
      
      // Update balance
      walletState.balance -= amount;
      
      // Return a fake transaction hash
      return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // Prepare the transaction parameters
    const transactionParameters = {
      from: accounts[0],
      to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Demo contract address
      value: amountInWei,
      // gas: '0x5208', // Optional: specify gas limit
      // gasPrice: '0x9184e72a000', // Optional: specify gas price
    };
    
    console.log("Requesting transaction approval from MetaMask", transactionParameters);
    
    // Request transaction with MetaMask
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
    
    console.log("Transaction approved:", txHash);
    
    // Update balance after transaction is approved
    walletState.balance -= amount;
    
    return txHash;
  } catch (error) {
    console.error("Transaction failed:", error);
    
    // For demo mode, allow transaction to "succeed" even if MetaMask is not present
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Simulating successful transaction despite error");
      
      // Update balance
      walletState.balance -= amount;
      
      // Return a fake transaction hash
      return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    }
    
    throw error;
  }
};

// Add winnings to wallet (simulates receiving funds from the contract)
export const receiveWinnings = async (amount: number): Promise<void> => {
  // In a real implementation, this would verify the transaction on the blockchain
  // For this demo, we just update the wallet balance
  walletState.balance += amount;
  
  console.log(`Added ${amount} ETH to wallet. New balance: ${walletState.balance}`);
  return Promise.resolve();
};

// Other blockchain methods would go here...
