'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout'
import AnalyticsOverview from '@/components/dashboard/analytics/AnalyticsOverview'

export default function SolanaAnalyticsPage() {
  const { connected, publicKey } = useWallet()

  return (
    <DashboardLayout 
      network="solana"
      isConnected={connected}
      walletAddress={publicKey?.toBase58()}
    >
      <AnalyticsOverview network="solana" walletAddress={publicKey?.toBase58()} />
    </DashboardLayout>
  )
}
