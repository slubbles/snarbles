'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, Rocket, Plus, Flame, Pause, Network, Sparkles, ExternalLink, BarChart3, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, supabaseHelpers, getAlgorandClient, validateUserBalance } from '@/lib/algorand';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { trackTokenCreation } from '@/lib/token-tracking';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { calculateTokenCreationFees, formatFeeDisplay, hasSufficientBalance } from '@/lib/algorand-fees';

interface TokenFormProps {
  tokenData: any;
  setTokenData: (data: any) => void;
}

interface DeploymentResult {
  success: boolean;
  assetId?: string;
  transactionId?: string;
  mintAddress?: string;
  signature?: string;
  error?: string;
  network?: string;
}

export default function TokenFormNew({ tokenData, setTokenData }: TokenFormProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [error, setError] = useState('');
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  const { connected: solanaConnected, publicKey: solanaPublicKey, signTransaction: signSolanaTransaction } = useWallet();
  const { connected: algorandConnected, address: algorandAddress, signTransaction: signAlgorandTransaction } = useAlgorandWallet();
  const { toast } = useToast();

  // Form validation
  const isFormValid = tokenData.name?.length >= 3 && 
                     tokenData.symbol?.length >= 2 && 
                     tokenData.description?.length >= 10 && 
                     tokenData.totalSupply && 
                     parseFloat(tokenData.totalSupply) > 0;

  const isWalletConnected = solanaConnected || algorandConnected;

  const handleInputChange = (field: string, value: any) => {
    setTokenData({
      ...tokenData,
      [field]: value
    });
  };

  const getExplorerUrl = (network: string, assetId: string) => {
    if (network.includes('algorand')) {
      const baseUrl = network.includes('mainnet') 
        ? 'https://explorer.perawallet.app'
        : 'https://testnet.explorer.perawallet.app';
      return `${baseUrl}/asset/${assetId}`;
    }
    // For Solana and other networks, you can add their explorer URLs here
    return '';
  };

  // Check user balance for Algorand networks
  const checkUserBalance = async () => {
    if (!algorandConnected || !algorandAddress || !tokenData.network.startsWith('algorand')) {
      setUserBalance(null);
      return;
    }

    setBalanceLoading(true);
    try {
      const algodClient = getAlgorandClient(tokenData.network);
      const balanceInfo = await validateUserBalance(algodClient, algorandAddress, tokenData.network);
      setUserBalance(balanceInfo.balanceAlgo);
    } catch (error) {
      console.error('Error checking balance:', error);
      setUserBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Check balance when wallet connects or network changes
  useEffect(() => {
    checkUserBalance();
  }, [algorandConnected, algorandAddress, tokenData.network]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !isWalletConnected) return;

    setIsDeploying(true);
    setShowModal(true);
    setError('');
    setDeploymentProgress(0);
    setDeploymentResult(null);

    try {
      const isAlgorand = tokenData.network.startsWith('algorand');
      let result;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setDeploymentProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      if (isAlgorand) {
        result = await createAlgorandToken(
          algorandAddress!,
          {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            decimals: parseInt(tokenData.decimals),
            totalSupply: tokenData.totalSupply,
            logoUrl: tokenData.logoUrl,
            website: tokenData.website,
            github: tokenData.github,
            twitter: tokenData.twitter,
            mintable: tokenData.mintable,
            burnable: tokenData.burnable,
            pausable: tokenData.pausable,
          },
          signAlgorandTransaction!,
          supabaseHelpers.uploadMetadataToStorage,
          tokenData.network,
          { onStepUpdate: () => {} }
        );
      } else {
        const walletInterface = {
          publicKey: solanaPublicKey!,
          signTransaction: signSolanaTransaction!
        };
        
        result = await createTokenOnChain(
          walletInterface as any,
          {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            decimals: parseInt(tokenData.decimals),
            totalSupply: parseInt(tokenData.totalSupply),
            logoUrl: tokenData.logoUrl,
            website: tokenData.website,
            github: tokenData.github,
            twitter: tokenData.twitter,
            mintable: tokenData.mintable,
            burnable: tokenData.burnable,
            pausable: tokenData.pausable,
          },
          { onStepUpdate: () => {} }
        );
      }

      clearInterval(progressInterval);
      setDeploymentProgress(100);

      if (result.success) {
        const deployResult: DeploymentResult = {
          success: true,
          network: tokenData.network,
          ...(isAlgorand ? {
            assetId: (result as any).assetId?.toString(),
            transactionId: (result as any).transactionId
          } : {
            mintAddress: (result as any).mintAddress,
            signature: (result as any).signature
          })
        };
        
        setDeploymentResult(deployResult);
        setShowConfetti(true); // Trigger confetti on success!
        
        // Track creation
        if (isSupabaseAvailable()) {
          try {
            const walletAddress = isAlgorand ? algorandAddress! : solanaPublicKey!.toString();
            trackTokenCreation({
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              contractAddress: isAlgorand ? (result as any).assetId?.toString() || '' : (result as any).mintAddress || '',
              description: tokenData.description,
              totalSupply: tokenData.totalSupply,
              decimals: parseInt(tokenData.decimals),
              logoUrl: tokenData.logoUrl,
              website: tokenData.website || '',
              github: tokenData.github || '',
              twitter: tokenData.twitter || '',
              mintable: tokenData.mintable,
              burnable: tokenData.burnable,
              pausable: tokenData.pausable,
              transactionHash: isAlgorand ? (result as any).transactionId || '' : (result as any).signature || '',
              walletAddress
            });
          } catch (err) {
            console.error('Tracking error:', err);
          }
        }

        toast({
          title: "Token Created Successfully!",
          description: `Your token "${tokenData.name}" is now live!`,
        });
      } else {
        throw new Error(result.error || 'Token creation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token';
      setError(errorMessage);
      setDeploymentResult({
        success: false,
        error: errorMessage,
        network: tokenData.network
      });
      
      toast({
        title: "Token Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setDeploymentResult(null);
    setError('');
    setDeploymentProgress(0);
    setShowConfetti(false);
  };

  const createAnother = () => {
    closeModal();
    // Reset form to defaults
    setTokenData({
      name: 'My Custom Token',
      symbol: 'MCT',
      description: 'A custom token created with Snarbles token platform',
      totalSupply: '1000000000',
      decimals: '9',
      logoUrl: '',
      website: '',
      twitter: '',
      github: '',
      mintable: true,
      burnable: false,
      pausable: false,
      network: 'algorand-mainnet'
    });
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-0" style={{ minHeight: '100vh' }}>
        {/* Form Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Your Token</h2>
              <p className="text-sm sm:text-base text-gray-300">Deploy a professional token in minutes</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-red-500">
                {isFormValid ? '100%' : Math.round(
                  (Object.values({
                    name: tokenData.name?.length >= 3,
                    symbol: tokenData.symbol?.length >= 2,
                    description: tokenData.description?.length >= 10,
                    supply: tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0
                  }).filter(Boolean).length / 4) * 100
                ) + '%'}
              </div>
              <div className="text-sm text-gray-400">Complete</div>
            </div>
          </div>
          
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-500"
              style={{ 
                width: `${isFormValid ? 100 : Math.round(
                  (Object.values({
                    name: tokenData.name?.length >= 3,
                    symbol: tokenData.symbol?.length >= 2,
                    description: tokenData.description?.length >= 10,
                    supply: tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0
                  }).filter(Boolean).length / 4) * 100
                )}%` 
              }}
            />
          </div>
        </div>

        {/* Main Form */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-900/80 border border-gray-800 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5" />
          <div className="relative z-10 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Network Selection */}
              <div className="space-y-4">
                <Label className="text-white font-semibold text-base sm:text-lg flex items-center space-x-3">
                  <Network className="w-5 h-5 text-red-500" />
                  <span>Deployment Network</span>
                </Label>
                <select
                  value={tokenData.network}
                  onChange={(e) => handleInputChange('network', e.target.value)}
                  className="w-full p-3 sm:p-4 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-sm sm:text-base touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <option value="algorand-testnet">Algorand Testnet (Free)</option>
                  <option value="algorand-mainnet">Algorand Mainnet</option>
                  <option value="solana-devnet">Solana Devnet (Free)</option>
                </select>
              </div>

              {/* Fee Display */}
              {(() => {
                const fees = calculateTokenCreationFees(tokenData.network);
                const isMainnet = tokenData.network.includes('mainnet');
                
                return (
                  <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 ${
                    isMainnet 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : 'bg-green-500/10 border-green-500/30'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isMainnet ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      }`}>
                        <BarChart3 className={`w-4 h-4 ${
                          isMainnet ? 'text-yellow-500' : 'text-green-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-2 ${
                          isMainnet ? 'text-yellow-300' : 'text-green-300'
                        }`}>
                          {isMainnet ? 'Mainnet Deployment Cost' : 'Testnet Deployment (Free)'}
                        </h3>
                        
                        {isMainnet ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">Platform Fee:</span>
                              <span className="text-white font-mono">
                                {formatFeeDisplay(fees.platformFee)} ALGO
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">Network Fee:</span>
                              <span className="text-white font-mono">
                                ~{formatFeeDisplay(fees.networkFees)} ALGO
                              </span>
                            </div>
                            <div className="border-t border-yellow-500/20 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-yellow-300 font-semibold">Total Cost:</span>
                                <span className="text-yellow-300 font-bold text-lg">
                                  {formatFeeDisplay(fees.totalFees)} ALGO
                                </span>
                              </div>
                            </div>
                                                         {/* Balance Status */}
                             {algorandConnected && algorandAddress && (
                               <div className="mt-3 space-y-2">
                                 <div className="flex justify-between items-center text-sm">
                                   <span className="text-gray-300">Your Balance:</span>
                                   <span className="text-white font-mono">
                                     {balanceLoading ? (
                                       <Loader2 className="w-4 h-4 animate-spin inline" />
                                     ) : userBalance !== null ? (
                                       `${userBalance.toFixed(3)} ALGO`
                                     ) : (
                                       'Loading...'
                                     )}
                                   </span>
                                 </div>
                                 
                                 {userBalance !== null && (
                                   <div className={`p-3 rounded-lg ${
                                     userBalance >= fees.feesInAlgo.totalFees
                                       ? 'bg-green-500/10 border border-green-500/20'
                                       : 'bg-red-500/10 border border-red-500/20'
                                   }`}>
                                     {userBalance >= fees.feesInAlgo.totalFees ? (
                                       <p className="text-xs text-green-200 flex items-center">
                                         <CheckCircle className="w-3 h-3 mr-1" />
                                         Sufficient balance for deployment
                                       </p>
                                     ) : (
                                       <p className="text-xs text-red-200 flex items-center">
                                         <AlertCircle className="w-3 h-3 mr-1" />
                                         Insufficient balance. Need {(fees.feesInAlgo.totalFees - userBalance).toFixed(3)} more ALGO
                                       </p>
                                     )}
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             {!algorandConnected && (
                               <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg">
                                 <p className="text-xs text-yellow-200">
                                   <AlertCircle className="w-3 h-3 inline mr-1" />
                                   Connect your Algorand wallet to check balance
                                 </p>
                               </div>
                             )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-green-200 text-sm">
                              Perfect for testing! No fees required on testnet.
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-green-300 font-semibold">Total Cost:</span>
                              <span className="text-green-300 font-bold text-lg">Free</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-white">Token Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center space-x-2 h-6">
                      <span>Token Name</span>
                      <span className="text-red-500">*</span>
                      {tokenData.name?.length >= 3 && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </Label>
                    <Input
                      value={tokenData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="My Awesome Token"
                      className={`h-11 sm:h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 text-sm sm:text-base touch-manipulation ${
                        tokenData.name?.length >= 3 ? 'border-green-500' : 'border-gray-700'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center space-x-2 h-6">
                      <span>Symbol</span>
                      <span className="text-red-500">*</span>
                      {tokenData.symbol?.length >= 2 && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </Label>
                    <Input
                      value={tokenData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      placeholder="MAT"
                      maxLength={8}
                      autoCapitalize="characters"
                      className={`h-11 sm:h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 font-mono text-sm sm:text-base touch-manipulation ${
                        tokenData.symbol?.length >= 2 ? 'border-green-500' : 'border-gray-700'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white font-medium flex items-center space-x-2 h-6">
                    <span>Description</span>
                    <span className="text-red-500">*</span>
                    {tokenData.description?.length >= 10 && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </Label>
                  <Textarea
                    value={tokenData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="A versatile token for my community and ecosystem"
                    rows={3}
                    className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 text-sm sm:text-base touch-manipulation ${
                      tokenData.description?.length >= 10 ? 'border-green-500' : 'border-gray-700'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent', resize: 'none' }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center space-x-2 h-6">
                      <span>Total Supply</span>
                      <span className="text-red-500">*</span>
                      {tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </Label>
                    <Input
                      type="number"
                      value={tokenData.totalSupply}
                      onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                      placeholder="1000000000"
                      className={`h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 ${
                        tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 ? 'border-green-500' : 'border-gray-700'
                      }`}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-medium h-6 flex items-center">Decimals</Label>
                    <Input
                      type="number"
                      value={tokenData.decimals}
                      onChange={(e) => handleInputChange('decimals', e.target.value)}
                      min="0"
                      max="18"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Optional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-white font-medium">Logo URL</Label>
                    <Input
                      value={tokenData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-medium">Website</Label>
                    <Input
                      value={tokenData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://mytoken.com"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-medium">Twitter</Label>
                    <Input
                      value={tokenData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/mytoken"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-medium">GitHub</Label>
                    <Input
                      value={tokenData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      placeholder="https://github.com/mytoken"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Token Features */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Token Features</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'mintable', label: 'Mintable', description: 'Allow creating more tokens later', icon: Plus },
                    { key: 'burnable', label: 'Burnable', description: 'Allow tokens to be destroyed', icon: Flame },
                    { key: 'pausable', label: 'Pausable', description: 'Emergency pause functionality', icon: Pause }
                  ].map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{feature.label}</h4>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={tokenData[feature.key]}
                          onCheckedChange={(checked) => handleInputChange(feature.key, checked)}
                          className="data-[state=checked]:bg-red-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                {(() => {
                  const fees = calculateTokenCreationFees(tokenData.network);
                  const isMainnet = tokenData.network.includes('mainnet');
                  const hasInsufficientBalance = isMainnet && algorandConnected && userBalance !== null && userBalance < fees.feesInAlgo.totalFees;
                  
                  return (
                    <Button
                      type="submit"
                      disabled={!isFormValid || !isWalletConnected || hasInsufficientBalance}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none shadow-lg shadow-red-500/30 transition-all duration-300 disabled:opacity-50 touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {!isWalletConnected ? 'Connect Wallet First' : 
                       hasInsufficientBalance ? 'Insufficient Balance' : (
                        <span className="flex items-center">
                          Deploy Token
                          {isMainnet && (
                            <span className="ml-2 text-xs opacity-80 hidden sm:inline">
                              ({formatFeeDisplay(fees.totalFees)} ALGO)
                            </span>
                          )}
                        </span>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </form>

            {error && !showModal && (
              <Alert className="mt-6 border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            // Allow closing modal by clicking backdrop (but not during deployment)
            if (e.target === e.currentTarget && !isDeploying) {
              closeModal();
            }
          }}
        >
          <div 
            className="relative max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl my-8 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-2xl" />
            
            {/* Close button - only show if not deploying */}
            {!isDeploying && (
              <button
                onClick={closeModal}
                type="button"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 z-50 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            <div className="relative z-10 p-6 sm:p-8">
              {isDeploying ? (
                /* Loading State */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Deploying Your Token...</h3>
                    <p className="text-sm sm:text-base text-gray-300">Please wait while we deploy to the blockchain</p>
                  </div>
                  <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${deploymentProgress}%` }}
                    />
                  </div>
                  <p className="text-gray-400">{deploymentProgress}% Complete</p>
                </div>
              ) : deploymentResult?.success ? (
                /* Success State */
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-green-500 mb-2">Token Created!</h3>
                    <p className="text-sm sm:text-base text-gray-300">Your token is now live on the blockchain</p>
                  </div>
                  
                  {/* Token Details */}
                  <div className="bg-gray-800/50 rounded-xl p-4 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm sm:text-base">Token Name:</span>
                      <span className="text-white font-medium text-sm sm:text-base truncate ml-2">{tokenData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm sm:text-base">Symbol:</span>
                      <span className="text-white font-mono text-sm sm:text-base">${tokenData.symbol}</span>
                    </div>
                    {deploymentResult.assetId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Asset ID:</span>
                        <span className="text-white font-mono text-xs sm:text-sm truncate ml-2" title={deploymentResult.assetId}>
                          {deploymentResult.assetId.length > 12 ? `${deploymentResult.assetId.slice(0, 12)}...` : deploymentResult.assetId}
                        </span>
                      </div>
                    )}
                    {deploymentResult.transactionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Transaction:</span>
                        <span className="text-white font-mono text-xs sm:text-sm truncate ml-2" title={deploymentResult.transactionId}>
                          {deploymentResult.transactionId.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {deploymentResult.assetId && deploymentResult.network?.includes('algorand') && (
                      <Button
                        onClick={() => window.open(getExplorerUrl(deploymentResult.network!, deploymentResult.assetId!), '_blank')}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => window.open('/dashboard', '_blank')}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                    
                    <Button
                      onClick={createAnother}
                      variant="outline"
                      className="w-full h-12 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm sm:text-base touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Create Another Token
                    </Button>
                  </div>
                </div>
              ) : (
                /* Error State */
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-red-500 mb-2">Deployment Failed</h3>
                    <p className="text-sm sm:text-base text-gray-300">Something went wrong during token creation</p>
                  </div>
                  
                  {/* Error Details */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{deploymentResult?.error || error}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={closeModal}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Try Again
                    </Button>
                    
                    <Button
                      onClick={() => window.open('/support', '_blank')}
                      variant="outline"
                      className="w-full h-12 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm sm:text-base touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Get Support
                    </Button>
                  </div>
                </div>
              )}
            </div>
                     </div>
         </div>
       )}

       {/* Success Confetti */}
       <SuccessConfetti 
         show={showConfetti} 
         duration={4000}
         onComplete={() => setShowConfetti(false)}
       />
     </>
   );
 }
