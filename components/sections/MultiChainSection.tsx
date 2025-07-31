"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NetworkBadge } from "@/components/ui/NetworkBadge"
import { CheckCircle, Clock, Zap } from "lucide-react"

const networks = [
  {
    name: "Solana Devnet",
    status: "Live",
    description: "Development network - Fast, low-cost transactions with instant finality",
    features: ["Sub-second finality", "Free transactions", "Perfect for testing"],
    color: "from-purple-500 to-blue-500",
    statusColor: "bg-green-500",
    icon: "S",
    network: "solana-devnet" as const,
    cost: "Free"
  },
  {
    name: "Algorand Testnet",
    status: "Live", 
    description: "Test network - Pure proof-of-stake with carbon-negative consensus",
    features: ["Carbon negative", "Free transactions", "Perfect for testing"],
    color: "from-blue-500 to-cyan-500",
    statusColor: "bg-green-500",
    icon: "A",
    network: "algorand-testnet" as const,
    cost: "Free"
  },
  {
    name: "SOON Network",
    status: "Coming Soon",
    description: "Next-generation blockchain with advanced features",
    features: ["Advanced features", "High performance", "Developer friendly"],
    color: "from-gray-600 to-gray-700",
    statusColor: "bg-yellow-500",
    icon: "S",
    network: undefined,
    cost: "TBD"
  },
]

export default function MultiChainSection() {
  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">Multi-Chain Support</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Choose Your Blockchain</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deploy your tokens across multiple blockchain networks with the same simple interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {networks.map((network, index) => (
            <div
              key={index}
              className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6 hover:bg-card/70 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${network.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {network.icon}
                </div>
                <div className="flex items-center space-x-2">
                  {network.network && <NetworkBadge network={network.network} />}
                  <div className={`w-2 h-2 rounded-full ${network.statusColor} animate-pulse`}></div>
                  <span
                    className={`text-sm font-medium ${network.status === "Live" ? "text-green-500" : "text-yellow-500"}`}
                  >
                    {network.status}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">{network.name}</h3>

              <p className="text-muted-foreground mb-6">{network.description}</p>

              <div className="space-y-3 mb-6">
                {network.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  network.status === "Live"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                } rounded-lg`}
                disabled={network.status !== "Live"}
              >
                {network.status === "Live" ? (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Deploy Now
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Coming Soon
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
