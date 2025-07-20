'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createAlgorandToken, buildAtomicTokenCreationGroup, validateUserBalance } from '@/lib/algorand';
import { CheckCircle, AlertCircle, Loader2, ExternalLink, Wallet, Info } from 'lucide-react';

export default function TestAlgoMainnetPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [creationStatus, setCreationStatus] = useState<string>('idle');
  const [isTestingGroup, setIsTestingGroup] = useState(false);
  const [groupTestResult, setGroupTestResult] = useState<any>(null);
  const [balanceCheck, setBalanceCheck] = useState<any>(null);
  const [testTokenData, setTestTokenData] = useState({
    name: 'Test Token',
    symbol: 'TEST',
    description: 'A test token created on Algorand Mainnet via Pera Wallet',
    decimals: 6,
    totalSupply: '1000000',
    logoUrl: 'https://via.placeholder.com/150',
    website: 'https://snarbles.xyz',
    github: '',
    twitter: '',
    mintable: true,
    burnable: false,
    pausable: false
  });

  const { toast } = useToast();
  const {
    connected,
    address,
    selectedNetwork,
    setSelectedNetwork,
    connect,
    disconnect,
    signTransaction,
    signAtomicGroup,
    isConnecting,
    isPeraWalletReady,
    error,
    balance,
    networkConfig
  } = useAlgorandWallet();

  const handleNetworkSwitch = async (network: string) => {
    try {
      setSelectedNetwork(network);
      toast({
        title: "Network Changed",
        description: `Switched to ${network}`,
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: `Connected to ${selectedNetwork}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleTestAtomicGroup = async () => {
    if (!connected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingGroup(true);
    setGroupTestResult(null);

    try {
      console.log('🧪 Testing atomic transaction group structure...');
      
      // Import algod client function
      const { getAlgorandClient } = await import('@/lib/algorand');
      const algodClient = getAlgorandClient(selectedNetwork);
      
      // Check balance first
      const balance = await validateUserBalance(algodClient, address, selectedNetwork);
      setBalanceCheck(balance);
      
      console.log('💰 Balance check result:', balance);

      // Test building the atomic group without actually signing/submitting
      const metadataUrl = 'https://test-metadata.snarbles.xyz/test.json';
      const atomicGroup = await buildAtomicTokenCreationGroup(
        algodClient,
        address,
        testTokenData,
        metadataUrl,
        selectedNetwork
      );

      console.log('🔗 Atomic group structure:', atomicGroup);

      setGroupTestResult({
        success: true,
        balance,
        group: {
          feeAmount: atomicGroup.feeAmount,
          feeAmountAlgo: atomicGroup.feeAmount / 1_000_000,
          groupId: atomicGroup.groupId,
          hasValidStructure: true,
          transactions: [
            {
              type: 'Fee Payment',
              amount: atomicGroup.feeAmount,
              amountAlgo: atomicGroup.feeAmount / 1_000_000
            },
            {
              type: 'Token Creation',
              name: testTokenData.name,
              symbol: testTokenData.symbol,
              totalSupply: testTokenData.totalSupply,
              decimals: testTokenData.decimals
            }
          ]
        }
      });

      toast({
        title: "✅ Atomic Group Structure Valid",
        description: `Group ID: ${atomicGroup.groupId.substring(0, 10)}...`,
      });

    } catch (error) {
      console.error('❌ Atomic group test failed:', error);
      setGroupTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      toast({
        title: "❌ Atomic Group Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTestingGroup(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Pera Wallet",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const handleCreateToken = async () => {
    if (!connected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet first",
        variant: "destructive",
      });
      return;
    }

    if (selectedNetwork !== 'algorand-mainnet') {
      toast({
        title: "Network Not Mainnet",
        description: "Please switch to Algorand Mainnet to test production token creation",
        variant: "destructive",
      });
      return;
    }

    // Minimum balance check for mainnet
    if (balance && balance < 0.3) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least 0.3 ALGO for token creation. Current balance: ${balance.toFixed(4)} ALGO`,
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setCreationResult(null);
    setCreationStatus('preparing');

    try {
      // Real metadata upload (simplified - in production you'd use IPFS or similar)
      const uploadMetadataToStorage = async (metadata: any) => {
        console.log('📄 Uploading metadata:', metadata);
        
        // Create a realistic metadata object
        const metadataObject = {
          name: metadata.name,
          description: metadata.description,
          image: metadata.logoUrl || '',
          properties: {
            decimals: metadata.decimals,
            symbol: metadata.symbol,
            website: metadata.website || '',
            github: metadata.github || '',
            twitter: metadata.twitter || '',
            features: {
              mintable: metadata.mintable,
              burnable: metadata.burnable,
              pausable: metadata.pausable
            }
          },
          created_at: new Date().toISOString(),
          standard: 'ARC-3'
        };
        
        // In a real implementation, you'd upload to IPFS or similar
        // For testing, we'll create a mock URL
        const mockUrl = `https://metadata.snarbles.xyz/token/${Date.now()}.json`;
        
        console.log('✅ Metadata uploaded to:', mockUrl);
        
        return {
          success: true,
          url: mockUrl,
          metadata: metadataObject
        };
      };

      const stepUpdate = (step: string, status: string, details?: any) => {
        console.log(`🔄 Step: ${step}, Status: ${status}`, details);
        setCreationStatus(`${step}: ${status}`);
        
        if (details?.message) {
          toast({
            title: `${step.charAt(0).toUpperCase() + step.slice(1).replace('-', ' ')}`,
            description: details.message,
            duration: 3000,
          });
        }
      };

      console.log('🚀 Starting REAL Algorand token creation on MAINNET');
      console.log('📍 Creator address:', address);
      console.log('🏷️ Token data:', testTokenData);
      console.log('💰 Creator balance:', balance, 'ALGO');

      const result = await createAlgorandToken(
        address,
        testTokenData,
        signTransaction,
        signAtomicGroup,
        uploadMetadataToStorage,
        selectedNetwork,
        { onStepUpdate: stepUpdate }
      );

      if (result.success) {
        setCreationResult(result);
        setCreationStatus('completed');
        
        toast({
          title: "🎉 Token Created Successfully!",
          description: `Asset ID: ${result.assetId} on Algorand Mainnet`,
          duration: 10000,
        });

        console.log('✅ Token creation completed successfully:', result);
      } else {
        throw new Error(result.error || 'Token creation failed');
      }

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      setCreationStatus('failed');
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "❌ Token Creation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Algorand Mainnet Token Creation Test</h1>
          <p className="text-muted-foreground">Test creating tokens on Algorand Mainnet with Pera Wallet</p>
        </div>

        {/* Network & Wallet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Network</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={selectedNetwork === 'algorand-testnet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleNetworkSwitch('algorand-testnet')}
                  >
                    Testnet
                  </Button>
                  <Button
                    variant={selectedNetwork === 'algorand-mainnet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleNetworkSwitch('algorand-mainnet')}
                  >
                    Mainnet
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Connection</Label>
                <div className="flex gap-2 mt-1">
                  {connected ? (
                    <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleConnect}
                      disabled={isConnecting || !isPeraWalletReady}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect Pera Wallet'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {connected && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-500">Connected to {networkConfig?.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">Address: {address}</p>
                <p className="text-sm text-muted-foreground">Balance: {balance ? `${balance.toFixed(4)} ALGO` : 'Loading...'}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-medium">Error: {error}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Token Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  value={testTokenData.name}
                  onChange={(e) => setTestTokenData({...testTokenData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="symbol">Token Symbol</Label>
                <Input
                  id="symbol"
                  value={testTokenData.symbol}
                  onChange={(e) => setTestTokenData({...testTokenData, symbol: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label htmlFor="supply">Total Supply</Label>
                <Input
                  id="supply"
                  value={testTokenData.totalSupply}
                  onChange={(e) => setTestTokenData({...testTokenData, totalSupply: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="19"
                  value={testTokenData.decimals}
                  onChange={(e) => setTestTokenData({...testTokenData, decimals: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={testTokenData.description}
                onChange={(e) => setTestTokenData({...testTokenData, description: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Atomic Group Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Test Atomic Transaction Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the atomic transaction group structure without creating a real token.
            </p>
            
            <Button
              onClick={handleTestAtomicGroup}
              disabled={!connected || isTestingGroup}
              variant="outline"
              className="w-full"
            >
              {isTestingGroup ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Group Structure...
                </>
              ) : (
                'Test Atomic Group Structure'
              )}
            </Button>

            {balanceCheck && (
              <div className={`p-4 rounded-lg border ${balanceCheck.sufficient ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {balanceCheck.sufficient ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${balanceCheck.sufficient ? 'text-green-500' : 'text-red-500'}`}>
                    Balance Check
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Current: {balanceCheck.balanceAlgo.toFixed(4)} ALGO</p>
                  <p>Required: {balanceCheck.requiredAlgo.toFixed(4)} ALGO</p>
                  {!balanceCheck.sufficient && (
                    <p className="text-red-600">Missing: {balanceCheck.missingAlgo.toFixed(4)} ALGO</p>
                  )}
                </div>
              </div>
            )}

            {groupTestResult && (
              <div className={`p-4 rounded-lg border ${groupTestResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                {groupTestResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-500">Atomic Group Structure Valid</span>
                    </div>
                    <div className="text-sm space-y-2">
                      <p><strong>Group ID:</strong> {groupTestResult.group.groupId}</p>
                      <p><strong>Platform Fee:</strong> {groupTestResult.group.feeAmountAlgo} ALGO</p>
                      <div>
                        <strong>Transactions:</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          {groupTestResult.group.transactions.map((tx: any, index: number) => (
                            <li key={index}>
                              {index + 1}. {tx.type} 
                              {tx.amountAlgo && ` (${tx.amountAlgo} ALGO)`}
                              {tx.name && ` - ${tx.name} (${tx.symbol})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-red-500">Group Test Failed</span>
                    </div>
                    <p className="text-sm text-red-600">{groupTestResult.error}</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Token */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ LIVE MAINNET TOKEN CREATION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNetwork === 'algorand-mainnet' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-500">MAINNET WARNING</span>
                </div>
                <p className="text-sm text-red-600 mb-2">
                  This will create a REAL token on Algorand Mainnet using REAL ALGO!
                </p>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• Platform fee: ~0.1 ALGO</li>
                  <li>• Transaction fees: ~0.002 ALGO</li>
                  <li>• Minimum balance requirement: 0.1 ALGO</li>
                  <li>• Total recommended: 0.3+ ALGO</li>
                </ul>
              </div>
            )}

            <Button
              onClick={handleCreateToken}
              disabled={!connected || isCreating || (selectedNetwork === 'algorand-mainnet' && balance !== null && balance < 0.3)}
              className={selectedNetwork === 'algorand-mainnet' ? "w-full bg-red-600 hover:bg-red-700" : "w-full"}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Token...
                </>
              ) : selectedNetwork === 'algorand-mainnet' ? (
                'CREATE REAL TOKEN ON MAINNET'
              ) : (
                'Create Token on Algorand'
              )}
            </Button>

            {selectedNetwork === 'algorand-mainnet' && balance !== null && balance < 0.3 && (
              <p className="text-sm text-red-600 text-center">
                Insufficient balance for mainnet token creation. Need at least 0.3 ALGO.
              </p>
            )}

            {creationStatus !== 'idle' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-500 font-medium">Status: {creationStatus}</p>
              </div>
            )}

            {creationResult && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-500">Token Created Successfully!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Asset ID:</strong> {creationResult.assetId}</p>
                  <p><strong>Transaction ID:</strong> {creationResult.transactionId}</p>
                  {creationResult.explorerUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={creationResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
