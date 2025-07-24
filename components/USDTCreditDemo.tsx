'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Coins, 
  CreditCard, 
  Globe, 
  Shield,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function USDTCreditDemo() {
  const [showDetails, setShowDetails] = useState(false);

  const networks = [
    { name: 'Polygon', icon: '🟣', fee: '$0.01-0.10', popular: true },
    { name: 'BSC', icon: '🟡', fee: '$0.20-1.00', popular: true },
    { name: 'Ethereum', icon: '🔷', fee: '$15-50', popular: false },
    { name: 'Arbitrum', icon: '🔵', fee: '$0.50-2.00', popular: false },
    { name: 'Optimism', icon: '🔴', fee: '$0.50-2.00', popular: false },
    { name: 'Avalanche', icon: '❄️', fee: '$0.50-2.00', popular: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-800">Multi-Network USDT Credit System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Purchase Snarbles credits using USDT from 6 different blockchain networks. 
            All payments go to a single address across all networks.
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Globe className="w-4 h-4 mr-2" />
            Receiver: 0x9ca8362c35db2649614cd4029ab0067d285660ef
          </Badge>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Simple Pricing</h3>
              <p className="text-3xl font-bold text-green-600 mb-2">1 USDT = 1 Credit</p>
              <p className="text-gray-600">No processing fees, stable conversion rate</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">6 Networks</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">Multi-Chain</p>
              <p className="text-gray-600">Choose the network with lowest fees</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">Verified</p>
              <p className="text-gray-600">Single receiving address, automatic credit addition</p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Networks */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Coins className="w-6 h-6" />
              Supported Networks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networks.map((network) => (
                <div
                  key={network.name}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${network.popular 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                    }
                  `}
                >
                  {network.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                      Popular
                    </Badge>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{network.icon}</div>
                    <div>
                      <div className="font-semibold text-lg">{network.name}</div>
                      <div className="text-sm text-gray-600">Gas: {network.fee}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Flow */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold">Choose Network</h4>
                <p className="text-sm text-gray-600">Select from 6 supported blockchain networks</p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold">Enter Amount</h4>
                <p className="text-sm text-gray-600">Choose how much USDT to spend (5-1000 USDT)</p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold">Send Payment</h4>
                <p className="text-sm text-gray-600">Send USDT to the provided address</p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-semibold">Get Credits</h4>
                <p className="text-sm text-gray-600">Credits added automatically after confirmation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6" />
              System Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">For Users</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>1:1 USDT to Credit conversion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Choose lowest fee network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Real-time payment tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Complete payment history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Automatic credit addition</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">For Administrators</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Single receiving address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Automated payment detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Comprehensive analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Manual confirmation backup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>Cross-network monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">Payment Method Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Feature</th>
                    <th className="text-left p-4">USDT Payment</th>
                    <th className="text-left p-4">ALGO Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Exchange Rate</td>
                    <td className="p-4">1 USDT = 1 Credit</td>
                    <td className="p-4">1 ALGO = 2 Credits</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Networks</td>
                    <td className="p-4">6 networks (ETH, Polygon, BSC, etc.)</td>
                    <td className="p-4">Algorand only</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Fees</td>
                    <td className="p-4">$0.01 - $50 (network dependent)</td>
                    <td className="p-4">~$0.001 (very low)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Processing</td>
                    <td className="p-4">1-3 minutes</td>
                    <td className="p-4">Instant</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 font-medium">Wallet Required</td>
                    <td className="p-4">Any EVM wallet</td>
                    <td className="p-4">Algorand wallet</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Top Up Your Credits?</h2>
          <p className="text-gray-600">Choose the payment method that works best for you</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.location.href = '/credits'}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Pay with USDT
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/credits'}
            >
              <Coins className="w-5 h-5 mr-2" />
              Pay with ALGO
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
