'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout'
import TokenManagementPage from '@/components/dashboard/tokens/TokenManagementPage'

export default function SolanaTokensPage() {
  const { connected, publicKey } = useWallet()

  return (
    <DashboardLayout 
      network="solana"
      isConnected={connected}
      walletAddress={publicKey?.toBase58()}
    >
      <TokenManagementPage 
        network="solana" 
        walletAddress={publicKey?.toBase58()}
      />
    </DashboardLayout>
  )
}
