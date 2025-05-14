import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { SolanaWalletProvider } from './components/solana/wallet-provider'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </StrictMode>
);
