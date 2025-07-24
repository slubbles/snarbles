'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Wallet, 
  CreditCard, 
  History, 
  TrendingUp,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useRouter } from 'next/navigation';
import { getCreditsBalance } from '@/lib/credit-system';

export default function ProfilePage() {
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress, walletType, isAuthenticated } = useWalletAuth();
  const router = useRouter();

  useEffect(() => {
    const loadUserCredits = async () => {
      if (!walletAddress) {
        setUserCredits(0);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const result = await getCreditsBalance(walletAddress);
        setUserCredits(result.success ? (result.balance || 0) : 0);
      } catch (error) {
        console.error('Error loading user credits:', error);
        setUserCredits(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCredits();
  }, [walletAddress]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen snarbles-background">
        <div className="snarbles-container py-8">
          <div className="snarbles-card p-12 text-center">
            <Wallet className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <h1 className="snarbles-heading-2 mb-4">Profile Page</h1>
            <p className="snarbles-body text-gray-300 mb-6">
              Connect your wallet to view your profile and token history.
            </p>
            <p className="snarbles-body-small text-gray-400 mb-6">
              This page will show your credit balance, transaction history, and token creation records.
            </p>
            <Button 
              className="snarbles-btn-primary"
              onClick={() => {
                // Scroll to top where wallet connection is
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen snarbles-background">
      <div className="snarbles-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="snarbles-heading-2 mb-2">Your Profile</h1>
          <p className="snarbles-body text-gray-400">
            Manage your account, view your credits, and track your token creation history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Information */}
            <Card className="snarbles-card">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 snarbles-glass-subtle rounded-lg">
                  <div>
                    <h4 className="snarbles-heading font-semibold mb-1">Connected Wallet</h4>
                    <p className="snarbles-body-small text-gray-400">
                      {walletType?.charAt(0).toUpperCase()}{walletType?.slice(1)} Wallet
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Connected
                  </Badge>
                </div>
                
                <div className="p-4 snarbles-glass-subtle rounded-lg">
                  <h4 className="snarbles-heading font-semibold mb-2">Wallet Address</h4>
                  <div className="flex items-center gap-2">
                    <code className="snarbles-body-small bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (walletAddress) {
                          navigator.clipboard.writeText(walletAddress);
                        }
                      }}
                    >
                      Copy Full Address
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credits Balance */}
            <Card className="snarbles-card border-green-500/20">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Credits Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-green-400 mb-2">
                    {isLoading ? '...' : userCredits.toLocaleString()}
                  </div>
                  <p className="snarbles-body text-gray-400 mb-4">Credits Available</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="snarbles-glass-subtle p-3 rounded-lg">
                      <div className="text-gray-400 mb-1">Mainnet Cost</div>
                      <div className="font-bold">5 credits</div>
                    </div>
                    <div className="snarbles-glass-subtle p-3 rounded-lg">
                      <div className="text-gray-400 mb-1">Testnet Cost</div>
                      <div className="font-bold text-green-400">FREE</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Creation Summary */}
            <Card className="snarbles-card">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Token Creation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    0
                  </div>
                  <p className="snarbles-body text-gray-400 mb-4">Tokens Created</p>
                  <p className="snarbles-body-small text-gray-500">
                    Your token creation history will appear here once you deploy your first token.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="snarbles-card">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-between snarbles-btn-primary"
                  onClick={() => router.push('/credits')}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Buy Credits
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <Button
                  className="w-full justify-between snarbles-btn-secondary"
                  onClick={() => router.push('/create')}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Create Token
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <Button
                  className="w-full justify-between snarbles-btn-secondary"
                  onClick={() => router.push('/dashboard')}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    View Dashboard
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="snarbles-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-yellow-400" />
                  Account Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="snarbles-body text-gray-400">Total Credits Spent:</span>
                  <span className="snarbles-heading font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="snarbles-body text-gray-400">Tokens on Mainnet:</span>
                  <span className="snarbles-heading font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="snarbles-body text-gray-400">Tokens on Testnet:</span>
                  <span className="snarbles-heading font-semibold">0</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="snarbles-body text-gray-400">Member Since:</span>
                    <span className="snarbles-heading font-semibold text-green-400">Today</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="snarbles-card border-red-500/20">
              <CardHeader>
                <CardTitle className="snarbles-heading-4 text-red-400">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="snarbles-body-small text-gray-400">
                  Having trouble with your account or token creation?
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/support')}
                  >
                    📚 Documentation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/contact')}
                  >
                    💬 Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 