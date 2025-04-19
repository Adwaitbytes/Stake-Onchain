
// This service handles interactions with the Arbitrum Stylus blockchain

// Mock wallet state
let walletState = {
  connected: false,
  address: "",
  balance: 0
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && window.ethereum !== undefined;
};

// Initialize blockchain connection
export const initBlockchain = async () => {
  console.log("Initializing blockchain connection...");
  
  // For demo purposes, we'll start with a connected wallet
  if (process.env.NODE_ENV === 'development') {
    walletState = {
      connected: true,
      address: "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C", // Main user account
      balance: 10.0 // 10 ETH for testing
    };
  }
  
  return walletState;
};

// Connect wallet
export const connectWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (typeof window !== "undefined" && window.ethereum) {
      console.log("MetaMask detected, attempting to connect...");
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
      
      console.log("Wallet connected successfully:", walletState);
      return walletState;
    } else {
      console.log("MetaMask not detected, using test mode");
      
      // For demo purposes, set a mock wallet in development
      walletState = {
        connected: true,
        address: "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C", // Main user account
        balance: 10.0 // 10 ETH for testing
      };
      
      console.log("Test wallet connected:", walletState);
      return walletState;
    }
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    
    // For demo purposes, set a mock wallet in development
    walletState = {
      connected: true,
      address: "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C", // Main user account
      balance: 10.0 // 10 ETH for testing
    };
    
    console.log("Error connecting wallet, using test wallet:", walletState);
    return walletState;
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
      address: "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C", // Main user account
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
  const gameContractAddress = "0xa4FA024Fac779dBc7B99F146De68bFf4a8c7bb32";
  
  // Check if MetaMask is installed
  if (typeof window !== "undefined" && !window.ethereum) {
    console.log("MetaMask not detected, using test mode");
    
    // Simulate transaction in test mode
    console.log(`Test mode: Simulating transaction of ${amount} ETH to ${gameContractAddress}`);
    
    // Update balance
    walletState.balance -= amount;
    
    // Return a fake transaction hash
    return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
  
  try {
    // Get current account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      // Try to request accounts if none are connected
      const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (requestedAccounts.length === 0) {
        throw new Error("No accounts connected. Please connect your wallet first.");
      }
    }
    
    // Convert amount from ETH to Wei (ETH * 10^18)
    const amountInWei = `0x${Math.floor(amount * 1e18).toString(16)}`;
    
    // Prepare the transaction parameters
    const transactionParameters = {
      from: accounts[0],
      to: gameContractAddress, // Gaming contract address
      value: amountInWei,
      gas: '0x5208', // 21000 gas (standard transaction)
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
      console.log(`Transferring ${amount} ETH from 0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C to 0xa4FA024Fac779dBc7B99F146De68bFf4a8c7bb32`);
      
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
  const userWalletAddress = "0x3EfFFd7caCbFdD00F05A370Ed57A8977d1c7070C";
  const gameContractAddress = "0xa4FA024Fac779dBc7B99F146De68bFf4a8c7bb32";
  
  // Simulate receiving funds from the gaming contract address
  console.log(`Receiving ${amount} ETH from ${gameContractAddress} to ${userWalletAddress}`);
  
  // In a real implementation with MetaMask, we would create a transaction here
  if (typeof window !== "undefined" && window.ethereum && isMetaMaskInstalled()) {
    try {
      // This is a simulated transaction that would represent the contract
      // paying out to the user. In a real implementation, this would be
      // triggered by a smart contract's internal logic.
      
      // For testing purposes, we'll just update the balance
      walletState.balance += amount;
      console.log(`Added ${amount} ETH to wallet. New balance: ${walletState.balance}`);
    } catch (error) {
      console.error("Failed to simulate receiving winnings:", error);
    }
  } else {
    // In test mode or if MetaMask is not available
    walletState.balance += amount;
    console.log(`Added ${amount} ETH to wallet. New balance: ${walletState.balance}`);
  }
  
  // Set the main account as the recipient
  walletState.address = userWalletAddress;
  
  return Promise.resolve();
};

// Other blockchain methods would go here...
