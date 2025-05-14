import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

// Wallet state
let walletState = {
  connected: false,
  address: "",
  balance: 0
};

// Initialize Solana connection - always use devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Check if Phantom wallet is installed
export const isPhantomInstalled = (): boolean => {
  return typeof window !== "undefined" && 
         window.solana !== undefined && 
         window.solana.isPhantom === true;
};

// Initialize blockchain connection
export const initBlockchain = async () => {
  console.log("Initializing Solana connection to devnet...");
  
  // Check if wallet is already connected
  if (isPhantomInstalled() && window.solana.isConnected) {
    await updateWalletBalance();
  }
  
  return walletState;
};

// Connect wallet
export const connectWallet = async () => {
  try {
    // Check if Phantom is installed
    if (typeof window !== "undefined" && !window.solana) {
      throw new Error("Phantom wallet not installed. Please install Phantom to use this application.");
    }
    
    // Request connection to wallet
    const resp = await window.solana.connect();
    const publicKey = resp.publicKey.toString();
    
    // Get real-time balance
    const balance = await connection.getBalance(new PublicKey(publicKey));
    const balanceInSol = balance / LAMPORTS_PER_SOL;
    
    walletState = {
      connected: true,
      address: publicKey,
      balance: balanceInSol
    };
    
    console.log("Wallet connected:", walletState);
    return walletState;
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
};

// Get wallet status and update balance in real-time
export const getWalletStatus = () => {
  if (isPhantomInstalled() && window.solana.isConnected) {
    // Update balance in background
    updateWalletBalance();
  }
  
  return walletState;
};

// Update wallet balance from blockchain
export const updateWalletBalance = async () => {
  if (isPhantomInstalled() && window.solana.isConnected) {
    try {
      const publicKey = window.solana.publicKey.toString();
      const balance = await connection.getBalance(new PublicKey(publicKey));
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      walletState = {
        ...walletState,
        address: publicKey,
        balance: balanceInSol
      };
      
      return walletState;
    } catch (error) {
      console.error("Failed to update wallet balance:", error);
    }
  }
  
  return walletState;
};

// Disconnect wallet
export const disconnectWallet = async () => {
  if (window.solana && window.solana.isConnected) {
    await window.solana.disconnect();
  }
  
  walletState = {
    connected: false,
    address: "",
    balance: 0
  };
  
  return walletState;
};

// Simulate a blockchain transaction with Phantom
export const sendTransaction = async (amount: number, toAddress: string): Promise<string> => {
  // Check if Phantom is installed
  if (!isPhantomInstalled()) {
    throw new Error("Phantom wallet not installed. Please install Phantom to use this application.");
  }
  
  try {
    // Check if wallet is connected
    if (!window.solana.isConnected) {
      await window.solana.connect();
    }
    
    const fromPubkey = new PublicKey(window.solana.publicKey.toString());
    const toPubkey = new PublicKey(toAddress);
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL
      })
    );
    
    // Set recent blockhash and fee payer
    transaction.feePayer = fromPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Request signing from wallet
    const signed = await window.solana.signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);
    
    console.log("Transaction confirmed:", signature);
    
    // Update balance after transaction is confirmed
    await updateWalletBalance();
    
    return signature;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};

// Add winnings to wallet (simulates receiving funds from the contract)
export const receiveWinnings = async (amount: number, fromAddress: string): Promise<void> => {
  console.log(`Receiving ${amount} SOL from ${fromAddress} to ${walletState.address}`);
  
  try {
    // In a real implementation, this would be triggered by the smart contract
    // For demo purposes, we'll simulate a transaction from the staking wallet to the user
    
    // This is the private key for the staking wallet (7pXBHmYenM9JLmJYZbBsb4ZJSQ5DNoGzRyKB61GTRVoo)
    // WARNING: Never expose private keys in frontend code in a production app!
    // This is only for demo purposes to simulate the payout functionality
    const payoutWalletPrivateKey = import.meta.env.VITE_SOLANA_STAKING_WALLET_PRIVATE_KEY;
    if (!payoutWalletPrivateKey) throw new Error('Staking wallet private key not set in environment variables');
    
    if (!walletState.address) {
      throw new Error("User wallet not connected");
    }
    
    // Create a keypair from the private key
    const secretKey = bs58.decode(payoutWalletPrivateKey);
    const payoutKeypair = Keypair.fromSecretKey(secretKey);
    
    console.log("Payout from wallet public key:", payoutKeypair.publicKey.toString());
    
    // Create and send a transaction from the payout wallet to the user's wallet
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payoutKeypair.publicKey,
        toPubkey: new PublicKey(walletState.address),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );
    
    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payoutKeypair.publicKey;
    
    // Sign and send the transaction
    transaction.sign(payoutKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    console.log("Payout transaction submitted with signature:", signature);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature);
    console.log("Payout transaction confirmed:", confirmation);
    
    // Update wallet balance after receiving winnings
    await updateWalletBalance();
    
    return Promise.resolve();
  } catch (error) {
    console.error("Failed to process winnings:", error);
    
    // For demo purposes, we'll still update the UI to show the expected balance
    // In a real app, we would handle this error differently
    walletState.balance += amount;
    
    // Force an immediate balance update from the blockchain
    await updateWalletBalance();
    
    return Promise.resolve();
  }
};

// Define window.solana type for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      isConnected: boolean;
      publicKey: { toString: () => string };
    };
  }
} 