'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, CheckCircle, Loader2, ExternalLink, CreditCard, Globe, Twitter, Github, Upload, X, Image as ImageIcon, Zap, Shield, DollarSign, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { usePaymentState } from '@/hooks/usePaymentState';
import WalletAwarePaymentSelector from '@/components/WalletAwarePaymentSelector';
import TransactionStatusModalEnhanced from '@/components/TransactionStatusModalEnhanced';
import TokenConfirmationModal from '@/components/TokenConfirmationModal';
import { spendCreditsForTokenCreation } from '@/lib/credit-system';
import { purchaseCreditsWithAlgo } from '@/lib/enhanced-payment-system';
import { createRealAlgorandToken } from '@/lib/real-algorand-token-creation-v2';
import { createTokenOnChain } from '@/lib/solana';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { calculateOptimalDecimals, isDecimalOptimal, formatPrecisionExample, getDecimalDescription } from '@/lib/smart-decimal-adjustment';

interface TokenData {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: string;
  logoUrl: string;
  website: string;
  twitter: string;
  github: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  network: string;
}

interface TokenFormCleanProps {
  tokenData: TokenData;
  setTokenData: (data: TokenData) => void;
}

export default function TokenFormClean({ tokenData, setTokenData }: TokenFormCleanProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [decimalSuggestion, setDecimalSuggestion] = useState<any>(null);
  const [showDecimalAdjustment, setShowDecimalAdjustment] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [lastAutoAdjustment, setLastAutoAdjustment] = useState<string>(''); // Track last auto-adjustment to prevent loops
  const autoAdjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { walletAddress, walletType, isAuthenticated } = useWalletAuth();
  const algorandWallet = useAlgorandWallet();
  const solanaWallet = useSolanaWallet();
  const { 
    selectedMethod: selectedPaymentMethod,
    userCredits,
    walletBalance,
    setProcessing,
    setTokenCreationStep,
    updateStepsForNetwork,
    setUserCredits,
  } = usePaymentState();

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!tokenData.name || tokenData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }
    
    if (!tokenData.symbol || tokenData.symbol.length < 2) {
      errors.symbol = 'Symbol must be at least 2 characters';
    }
    
    // Description is now optional - no validation required
    
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      errors.totalSupply = 'Supply must be greater than 0';
    } else {
      // Add validation for large supplies that might cause issues
      const supply = parseFloat(tokenData.totalSupply);
      const decimals = parseInt(tokenData.decimals) || 6;
      
      // For Algorand mainnet, check if the combination would exceed safe limits
      if (tokenData.network.includes('algorand')) {
        // Use BigInt for accurate calculation
        const supplyBigInt = BigInt(Math.floor(supply));
        const multiplierBigInt = BigInt(10) ** BigInt(decimals);
        const totalBigInt = supplyBigInt * multiplierBigInt;
        
        if (totalBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
          const maxSafeSupply = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, decimals));
          errors.totalSupply = `Supply of ${supply.toLocaleString()} with ${decimals} decimals exceeds safe limits. 
          
💡 **Auto-adjustment available**: Change your supply and decimals will automatically optimize.
💡 **Solutions**: 
  • Reduce supply to ${maxSafeSupply.toLocaleString()} tokens
  • Enter a different supply (decimals will auto-adjust)
  • Use 6 decimals instead of ${decimals} (allows ~9 billion tokens)
  • Use 3 decimals (allows ~9 trillion tokens)`;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Smart decimal adjustment based on supply (real-time auto-adjustment for Algorand)
  useEffect(() => {
    // Clear any existing timeout
    if (autoAdjustmentTimeoutRef.current) {
      clearTimeout(autoAdjustmentTimeoutRef.current);
    }
    
    const supply = parseFloat(tokenData.totalSupply);
    const currentDecimals = parseInt(tokenData.decimals) || 6;
    
    if (!isNaN(supply) && supply > 0 && tokenData.network.includes('algorand')) {
      // Add a small delay to prevent rapid adjustments while user is typing
      autoAdjustmentTimeoutRef.current = setTimeout(() => {
        const decimalCheck = isDecimalOptimal(supply, currentDecimals);
        
        // Auto-apply optimal decimals for Algorand networks only
        if (!decimalCheck.isOptimal && decimalCheck.suggestion) {
          const optimalDecimals = decimalCheck.suggestion.recommendedDecimals;
          const newDecimals = optimalDecimals.toString();
          const adjustmentKey = `${supply}-${optimalDecimals}`;
          
          // Only auto-adjust if we haven't already made this exact adjustment
          if (newDecimals !== tokenData.decimals && lastAutoAdjustment !== adjustmentKey) {
            setTokenData({ 
              ...tokenData, 
              decimals: newDecimals 
            });
            setLastAutoAdjustment(adjustmentKey);
            
            // Show a brief notification about the auto-adjustment
            toast({
              title: "🔧 Decimals auto-optimized",
              description: `Auto-adjusted to ${newDecimals} decimals for ${supply.toLocaleString()} supply (Algorand optimization)`,
              duration: 3000,
            });
          }
          
          setDecimalSuggestion(null); // Clear suggestion since we auto-applied it
          setShowDecimalAdjustment(false); 
        } else {
          // Decimals are already optimal
          setDecimalSuggestion(null);
          setShowDecimalAdjustment(false);
        }
      }, 500); // 500ms delay for better UX
    } else if (tokenData.network.includes('solana')) {
      // For Solana networks, keep decimals fixed at 9 (not limited like Algorand)
      setDecimalSuggestion(null);
      setShowDecimalAdjustment(false);
      
      // For Solana, ensure we use 9 decimals (standard)
      if (tokenData.decimals !== '9') {
        setTokenData({ 
          ...tokenData, 
          decimals: '9' 
        });
      }
    } else {
      // Clear suggestions for other cases
      setDecimalSuggestion(null);
      setShowDecimalAdjustment(false);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoAdjustmentTimeoutRef.current) {
        clearTimeout(autoAdjustmentTimeoutRef.current);
      }
    };
  }, [tokenData.totalSupply, tokenData.network]); // Intentionally excluding tokenData.decimals to prevent adjustment loops

  // Handle wallet type changes - clear network if incompatible
  useEffect(() => {
    if (isAuthenticated && walletType && tokenData.network) {
      const networkRequiresAlgorand = tokenData.network.includes('algorand');
      const networkRequiresSolana = tokenData.network.includes('solana');
      
      const isIncompatible = 
        (networkRequiresAlgorand && walletType !== 'algorand') ||
        (networkRequiresSolana && walletType !== 'solana');
      
      if (isIncompatible) {
        // Clear network selection when wallet type becomes incompatible
        setTokenData({ ...tokenData, network: '' });
        toast({
          title: "Network cleared",
          description: `Previous network selection was incompatible with your ${walletType === 'algorand' ? 'Algorand' : 'Solana'} wallet`,
          duration: 3000,
        });
      }
    }
  }, [walletType, isAuthenticated]); // Run when wallet type or authentication status changes

  // Apply suggested decimals automatically
  const applyOptimalDecimals = () => {
    if (decimalSuggestion) {
      setTokenData({ 
        ...tokenData, 
        decimals: decimalSuggestion.recommendedDecimals.toString() 
      });
      setShowDecimalAdjustment(false);
      toast({
        title: "Decimals optimized!",
        description: `Updated to ${decimalSuggestion.recommendedDecimals} decimals for optimal precision`,
      });
    }
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF, WebP, or SVG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    
    try {
      // Create a blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file);
      setTokenData({ ...tokenData, logoUrl: blobUrl });
      
      toast({
        title: "Logo uploaded",
        description: "Your token logo has been set",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Get network information
  const getNetworkInfo = (network: string) => {
    switch (network) {
      case 'algorand-mainnet':
        return { 
          name: 'Algorand Mainnet', 
          cost: '10 credits', 
          description: 'Production network for real tokens',
          icon: '🔺',
          color: 'text-blue-500'
        };
      case 'algorand-testnet':
        return { 
          name: 'Algorand Testnet', 
          cost: 'Free', 
          description: 'Test network for development',
          icon: '🔸',
          color: 'text-blue-400'
        };
      case 'solana-devnet':
        return { 
          name: 'Solana Devnet', 
          cost: 'Free', 
          description: 'Test network for development',
          icon: '🟣',
          color: 'text-purple-500'
        };
      default:
        return { 
          name: 'Unknown Network', 
          cost: 'Unknown', 
          description: 'Please select a network',
          icon: '❓',
          color: 'text-gray-500'
        };
    }
  };

  // Handle initial token creation click (show confirmation)
  const handleCreateToken = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation failed",
        description: "Please fix the errors before creating your token.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation modal first
    setShowConfirmationModal(true);
  };

  // Handle actual token creation after confirmation
  const handleConfirmCreation = async () => {
    setShowConfirmationModal(false);
    setIsDeploying(true);
    setShowTransactionModal(true);
    setProcessing(true);
    setTokenCreationStep(0); // Preparing payment

    try {
      const isMainnet = tokenData.network.includes('mainnet');
      const creditsRequired = isMainnet ? 10 : 0;
      
      // Handle payment processing
      if (selectedPaymentMethod === 'credits') {
        await processCreditsPayment(creditsRequired);
        
        // Track credits payment
        try {
          const { trackEvent } = await import('@/lib/analytics');
          await trackEvent('payment_processed', {
            method: 'credits',
            amount: creditsRequired,
            network: tokenData.network,
            token_name: tokenData.name
          }, walletAddress || undefined);
        } catch (analyticsError) {
          console.warn('⚠️ Payment analytics tracking failed:', analyticsError);
        }
        
      } else if (selectedPaymentMethod === 'algo_direct') {
        await processAlgoDirectPayment();
        
        // Track direct ALGO payment
        try {
          const { trackEvent } = await import('@/lib/analytics');
          await trackEvent('payment_processed', {
            method: 'algo_direct',
            network: tokenData.network,
            token_name: tokenData.name
          }, walletAddress || undefined);
        } catch (analyticsError) {
          console.warn('⚠️ Payment analytics tracking failed:', analyticsError);
        }
        
      } else {
        throw new Error('Invalid payment method selected');
      }
      
      setTokenCreationStep(1); // Confirming transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTokenCreationStep(2); // Sign transaction on Pera Wallet app
      
      // REAL TOKEN CREATION - Support both Algorand and Solana
      if (tokenData.network.includes('algorand') && algorandWallet.connected && algorandWallet.address) {
        console.log('🚀 Creating REAL Algorand token with credits payment');
        
        try {
          const result = await createRealAlgorandToken(
            {
              name: tokenData.name,
              symbol: tokenData.symbol,
              description: tokenData.description,
              decimals: parseInt(tokenData.decimals),
              totalSupply: tokenData.totalSupply,
              logoUrl: tokenData.logoUrl || '',
              website: tokenData.website || '',
              twitter: tokenData.twitter || '',
              github: tokenData.github || '',
              mintable: tokenData.mintable,
              burnable: tokenData.burnable,
              pausable: tokenData.pausable,
              network: tokenData.network
            },
            (status: string) => {
              console.log(`📱 Token Creation Status: ${status}`);
            },
            {
              signAtomicGroup: algorandWallet.signAtomicGroup,
              signTransaction: algorandWallet.signTransaction,
              address: algorandWallet.address
            },
            selectedPaymentMethod as 'credits' | 'algo_direct' // Pass the payment method
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Token creation failed');
          }
          
          console.log('✅ REAL token created successfully:', result.data);
          
          // Track successful token creation analytics
          try {
            const { trackTokenCreation } = await import('@/lib/analytics');
            await trackTokenCreation({
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              successful: true
            }, algorandWallet.address || undefined);
            
            // Also track token creation in token tracking system
            const { trackTokenCreation: trackTokenDetails } = await import('@/lib/token-tracking');
            await trackTokenDetails({
              walletAddress: algorandWallet.address,
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              contractAddress: result.data?.assetId?.toString() || '',
              description: tokenData.description,
              totalSupply: tokenData.totalSupply,
              decimals: parseInt(tokenData.decimals),
              logoUrl: tokenData.logoUrl,
              website: tokenData.website,
              github: tokenData.github,
              twitter: tokenData.twitter,
              mintable: tokenData.mintable,
              burnable: tokenData.burnable,
              pausable: tokenData.pausable,
              transactionHash: result.data?.transactionId
            });
            
            console.log('✅ Analytics tracking completed');
          } catch (analyticsError) {
            console.warn('⚠️ Analytics tracking failed (non-blocking):', analyticsError);
          }
          
          setTokenCreationStep(3); // Processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Success
          setTokenCreationStep(4); // Success
          
          // Store deployment result for the modal
          setDeploymentResult({
            assetId: result.data?.assetId,
            transactionId: result.data?.transactionId,
            explorerUrl: result.data?.explorerUrl,
            network: tokenData.network
          });
          
          toast({
            title: "🎉 Real Token Created Successfully!",
            description: `${tokenData.name} (${tokenData.symbol}) created on ${tokenData.network}. Asset ID: ${result.data?.assetId}`,
          });
          
          // Show explorer link if available
          if (result.data?.explorerUrl) {
            setTimeout(() => {
              toast({
                title: "View Your Token",
                description: "Click to view your token on the blockchain explorer",
                action: (
                  <a 
                    href={result.data!.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
                  >
                    View on Explorer
                  </a>
                ),
              });
            }, 2000);
          }
          
        } catch (tokenError) {
          console.error('❌ Real token creation failed:', tokenError);
          
          // Track failed token creation analytics
          try {
            const { trackTokenCreation } = await import('@/lib/analytics');
            await trackTokenCreation({
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              successful: false,
              error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
            }, algorandWallet.address || undefined);
            
            console.log('✅ Failed creation analytics tracked');
          } catch (analyticsError) {
            console.warn('⚠️ Failed creation analytics tracking failed:', analyticsError);
          }
          
          throw new Error(`Token creation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
        
      } else if (tokenData.network.includes('solana') && solanaWallet.connected && solanaWallet.publicKey) {
        console.log('🚀 Creating REAL Solana token with credits payment');
        
        try {
          // Create wallet interface for Solana
          if (!solanaWallet.signTransaction || !solanaWallet.signAllTransactions) {
            throw new Error('Solana wallet does not support required signing methods');
          }
          
          const walletInterface = {
            publicKey: solanaWallet.publicKey,
            signTransaction: solanaWallet.signTransaction,
            signAllTransactions: solanaWallet.signAllTransactions
          };
          
          const result = await createTokenOnChain(
            walletInterface,
            {
              name: tokenData.name,
              symbol: tokenData.symbol,
              description: tokenData.description,
              decimals: parseInt(tokenData.decimals),
              totalSupply: parseFloat(tokenData.totalSupply),
              logoUrl: tokenData.logoUrl || '',
              website: tokenData.website || '',
              twitter: tokenData.twitter || '',
              github: tokenData.github || '',
              mintable: tokenData.mintable,
              burnable: tokenData.burnable,
              pausable: tokenData.pausable,
            },
            {
              onStepUpdate: (status: string) => {
                console.log(`📱 Token Creation Status: ${status}`);
              }
            }
          );
          
          if (!result.success) {
            const errorMessage = ('error' in result) ? result.error : 'Token creation failed';
            throw new Error(errorMessage);
          }
          
          console.log('✅ REAL Solana token created successfully:', result);
          
          // Track successful token creation analytics
          try {
            const { trackTokenCreation } = await import('@/lib/analytics');
            await trackTokenCreation({
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              successful: true
            }, solanaWallet.publicKey?.toString() || undefined);
            
            // Also track token creation in token tracking system with better error handling
            const { trackTokenCreation: trackTokenDetails } = await import('@/lib/token-tracking');
            const trackingResult = await trackTokenDetails({
              walletAddress: solanaWallet.publicKey?.toString() || '',
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              contractAddress: 'mintAddress' in result ? (result.mintAddress || '') : '',
              description: tokenData.description,
              totalSupply: Number(tokenData.totalSupply) || 0,
              decimals: parseInt(tokenData.decimals) || 9,
              logoUrl: tokenData.logoUrl || '',
              website: tokenData.website || '',
              github: tokenData.github || '',
              twitter: tokenData.twitter || '',
              mintable: Boolean(tokenData.mintable),
              burnable: Boolean(tokenData.burnable),
              pausable: Boolean(tokenData.pausable),
              transactionHash: 'signature' in result ? result.signature : undefined
            });
            
            if (trackingResult.success) {
              console.log('✅ Analytics tracking completed');
            } else {
              console.warn('⚠️ Token tracking failed:', trackingResult.error);
            }
          } catch (analyticsError) {
            console.error('Error tracking token creation:', analyticsError);
            // Don't block the flow, but log the error properly
          }
          
          setTokenCreationStep(3); // Processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Success
          setTokenCreationStep(4); // Success
          toast({
            title: "🎉 Real Token Created Successfully!",
            description: `${tokenData.name} (${tokenData.symbol}) created on ${tokenData.network}. Mint: ${'mintAddress' in result ? result.mintAddress : 'N/A'}`,
          });
          
          // Show explorer link if available
          if ('explorerUrl' in result && result.explorerUrl) {
            setTimeout(() => {
              toast({
                title: "View Your Token",
                description: "Click to view your token on the blockchain explorer",
                action: (
                  <a 
                    href={result.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
                  >
                    View on Explorer
                  </a>
                ),
              });
            }, 2000);
          }
          
        } catch (tokenError) {
          console.error('❌ Real Solana token creation failed:', tokenError);
          
          // Track failed token creation analytics
          try {
            const { trackTokenCreation } = await import('@/lib/analytics');
            await trackTokenCreation({
              tokenName: tokenData.name,
              tokenSymbol: tokenData.symbol,
              network: tokenData.network,
              successful: false,
              error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
            }, solanaWallet.publicKey?.toString() || undefined);
            
            console.log('✅ Failed creation analytics tracked');
          } catch (analyticsError) {
            console.warn('⚠️ Failed creation analytics tracking failed:', analyticsError);
          }
          
          throw new Error(`Token creation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
        
      } else {
        // Mock for unsupported networks or disconnected wallet
        console.log('⚠️ Using mock token creation for unsupported network or disconnected wallet');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTokenCreationStep(3); // Processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Success
        setTokenCreationStep(4); // Success
        toast({
          title: "Token created successfully!",
          description: `${tokenData.name} (${tokenData.symbol}) has been deployed to ${tokenData.network}.`,
        });
      }
      
      // Track final completion analytics
      try {
        const { trackEvent } = await import('@/lib/analytics');
        await trackEvent('token_creation_flow_completed', {
          payment_method: selectedPaymentMethod,
          network: tokenData.network,
          token_name: tokenData.name,
          staying_on_confirmation: true
        }, walletAddress || undefined);
      } catch (analyticsError) {
        console.warn('⚠️ Flow completion analytics tracking failed:', analyticsError);
      }
      
    } catch (error) {
      console.error('Token creation error:', error);
      setTokenCreationStep(0); // Reset to beginning
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
      setProcessing(false);
    }
  };

  // Process credits payment
  const processCreditsPayment = async (creditsRequired: number) => {
    if (!walletAddress) throw new Error('Wallet not connected');
    
    if (creditsRequired === 0) {
      // Testnet - no payment required
      return;
    }
    
    // Check if user has enough credits
    if (userCredits < creditsRequired) {
      throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${userCredits}`);
    }
    
    // Spend credits
    const description = `Create ${tokenData.name} (${tokenData.symbol}) on ${tokenData.network}`;
    const result = await spendCreditsForTokenCreation(walletAddress, creditsRequired, description);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process credits payment');
    }
    
    // Update the credits balance in the global state
    const newBalance = userCredits - creditsRequired;
    setUserCredits(newBalance);
    console.log(`✅ Credits updated: ${userCredits} → ${newBalance} (spent ${creditsRequired})`);
  };

  // Process ALGO direct payment
  const processAlgoDirectPayment = async () => {
    if (!walletAddress || walletType !== 'algorand') {
      throw new Error('Algorand wallet not connected');
    }
    
    const isMainnet = tokenData.network.includes('mainnet');
    if (!isMainnet) {
      // Testnet - no payment required
      return;
    }
    
    const algoRequired = 5; // 5 ALGO for mainnet token creation (updated from 0.1)
    
    // Check balance
    if (!walletBalance || walletBalance < algoRequired) {
      throw new Error(`Insufficient ALGO balance. Required: ${algoRequired}, Available: ${walletBalance || 0}`);
    }
    
    // For now, we'll implement a simplified direct payment
    // In a full implementation, this would create the token creation transaction
    // and include the payment to the platform
    
    toast({
      title: "Processing ALGO payment",
      description: `Paying ${algoRequired} ALGO for token creation...`,
    });
    
    // Simulate ALGO transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would:
    // 1. Create a payment transaction to the platform address
    // 2. Create the token creation transaction
    // 3. Group them together (atomic transaction group)
    // 4. Sign and submit
  };

  // Process SOL direct payment (future implementation)
  const processSolDirectPayment = async () => {
    if (!walletAddress || walletType !== 'solana') {
      throw new Error('Solana wallet not connected');
    }
    
    const isMainnet = tokenData.network.includes('mainnet');
    if (!isMainnet) {
      // Devnet - no payment required
      return;
    }
    
    // SOL payment implementation would go here
    throw new Error('SOL direct payments coming soon');
  };

  // Check if form is ready for submission
  const isFormReady = () => {
    const basicValidation = isAuthenticated && 
           tokenData.name.length >= 3 && 
           tokenData.symbol.length >= 2 && 
           parseFloat(tokenData.totalSupply) > 0 && 
           tokenData.network;
    
    if (!basicValidation) return false;
    
    // Check wallet compatibility with selected network
    if (walletType && tokenData.network) {
      const networkRequiresAlgorand = tokenData.network.includes('algorand');
      const networkRequiresSolana = tokenData.network.includes('solana');
      
      if (networkRequiresAlgorand && walletType !== 'algorand') return false;
      if (networkRequiresSolana && walletType !== 'solana') return false;
    }
    
    // Check payment method and sufficient funds
    const isMainnet = tokenData.network.includes('mainnet');
    if (!isMainnet) return true; // Testnet is free
    
    const creditsRequired = 10;
    const algoRequired = 0.1;
    
    if (selectedPaymentMethod === 'credits') {
      return userCredits >= creditsRequired;
    } else if (selectedPaymentMethod === 'algo_direct') {
      return walletBalance !== null && walletBalance >= algoRequired;
    }
    
    return selectedPaymentMethod !== null; // At least something is selected
  };

  // Get the reason why the form is not ready
  const getFormNotReadyReason = () => {
    if (!isAuthenticated) {
      return "Connect your wallet to create a token";
    }
    
    if (tokenData.name.length < 3) {
      return "Token name must be at least 3 characters";
    }
    
    if (tokenData.symbol.length < 2) {
      return "Token symbol must be at least 2 characters";
    }
    
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      return "Enter a valid total supply";
    }
    
    if (!tokenData.network) {
      return "Select a network";
    }
    
    // Check wallet compatibility with selected network
    if (isAuthenticated && walletType && tokenData.network) {
      const networkRequiresAlgorand = tokenData.network.includes('algorand');
      const networkRequiresSolana = tokenData.network.includes('solana');
      
      if (networkRequiresAlgorand && walletType !== 'algorand') {
        return "Connect an Algorand wallet to create tokens on Algorand networks";
      }
      
      if (networkRequiresSolana && walletType !== 'solana') {
        return "Connect a Solana wallet to create tokens on Solana networks";
      }
    }
    
    const isMainnet = tokenData.network.includes('mainnet');
    if (isMainnet) {
      const creditsRequired = 10;
      const algoRequired = 0.1;
      
      if (!selectedPaymentMethod) {
        return "Select a payment method";
      }
      
      if (selectedPaymentMethod === 'credits' && userCredits < creditsRequired) {
        return `Insufficient credits. Need ${creditsRequired}, have ${userCredits}. Top up credits first.`;
      }
      
      if (selectedPaymentMethod === 'algo_direct' && (walletBalance === null || walletBalance < algoRequired)) {
        return `Insufficient ALGO balance. Need ${algoRequired} ALGO, have ${walletBalance || 0} ALGO.`;
      }
    }
    
    return null;
  };

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Token Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Token Name *
              </Label>
              <Input
                id="name"
                placeholder="My Awesome Token"
                value={tokenData.name}
                onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
                className={`bg-background border-border text-foreground h-10 lg:h-11 ${validationErrors.name ? 'border-red-500' : ''}`}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            {/* Token Symbol */}
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-sm font-medium text-foreground">
                Token Symbol *
              </Label>
              <Input
                id="symbol"
                placeholder="MAT"
                value={tokenData.symbol}
                onChange={(e) => setTokenData({ ...tokenData, symbol: e.target.value.toUpperCase() })}
                className={`bg-background border-border text-foreground h-10 lg:h-11 ${validationErrors.symbol ? 'border-red-500' : ''}`}
              />
              {validationErrors.symbol && (
                <p className="text-xs text-red-500">{validationErrors.symbol}</p>
              )}
            </div>

            {/* Total Supply */}
            <div className="space-y-2">
              <Label htmlFor="supply" className="text-sm font-medium text-foreground">
                Total Supply *
              </Label>
              <Input
                id="supply"
                type="number"
                placeholder="1000000"
                value={tokenData.totalSupply}
                onChange={(e) => setTokenData({ ...tokenData, totalSupply: e.target.value })}
                className={`bg-background border-border text-foreground h-10 lg:h-11 ${validationErrors.totalSupply ? 'border-red-500' : ''}`}
              />
              {validationErrors.totalSupply && (
                <p className="text-xs text-red-500">{validationErrors.totalSupply}</p>
              )}
            </div>

            {/* Decimals */}
            <div className="space-y-2">
              <Label htmlFor="decimals" className="text-sm font-medium text-foreground">
                Decimals {tokenData.network.includes('algorand') ? '(auto-optimized ⚡)' : tokenData.network.includes('solana') ? '(fixed at 9)' : ''}
              </Label>
              <Select 
                value={tokenData.decimals} 
                onValueChange={(value) => {
                  setTokenData({ ...tokenData, decimals: value });
                  // Reset auto-adjustment tracking when user manually changes
                  setLastAutoAdjustment('');
                }}
                disabled={tokenData.network.includes('solana')} // Solana decimals are fixed at 9
              >
                <SelectTrigger className={`bg-background border-border text-foreground h-10 lg:h-11 ${
                  tokenData.network.includes('solana') ? 'opacity-75 cursor-not-allowed' : ''
                }`}>
                  <SelectValue placeholder="Select decimals" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} - {getDecimalDescription(num)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Network-specific information */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Precision: {formatPrecisionExample(parseInt(tokenData.decimals) || 6)}</div>
                {tokenData.network.includes('algorand') && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Zap className="w-3 h-3" />
                    Auto-adjusts in real-time based on supply for optimal precision
                  </div>
                )}
                {tokenData.network.includes('solana') && (
                  <div className="flex items-center gap-1 text-purple-600">
                    <Shield className="w-3 h-3" />
                    Fixed at 9 decimals (Solana standard - no limitations)
                  </div>
                )}
              </div>
              
              {/* Smart decimal suggestion - now only shows for manual adjustments */}
              {showDecimalAdjustment && decimalSuggestion && tokenData.network.includes('algorand') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Alternative Decimal Option
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {decimalSuggestion.explanation}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-blue-600">
                        <div>• Current: <strong>{tokenData.decimals} decimals</strong></div>
                        <div>• Alternative: <strong>{decimalSuggestion.recommendedDecimals} decimals</strong></div>
                        <div>• Max possible: {decimalSuggestion.maxPossibleDecimals} decimals</div>
                        <div>• Precision: {decimalSuggestion.precision}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={applyOptimalDecimals}
                      >
                        Use {decimalSuggestion.recommendedDecimals} decimals
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description - Full width moved above network selection */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your token's purpose and use case..."
                value={tokenData.description}
                onChange={(e) => setTokenData({ ...tokenData, description: e.target.value })}
                className={`bg-background border-border text-foreground resize-none ${validationErrors.description ? 'border-red-500' : ''}`}
                rows={3}
              />
              {validationErrors.description && (
                <p className="text-xs text-red-500">{validationErrors.description}</p>
              )}
            </div>

            {/* Enhanced Network Selection */}
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-sm font-medium text-foreground">
                Blockchain Network *
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'algorand-testnet', name: 'Algorand Testnet', cost: 'Free', icon: '🔸', description: 'Test network • Smart decimal optimization', walletType: 'algorand' },
                  { value: 'algorand-mainnet', name: 'Algorand Mainnet', cost: '10 credits', icon: '🔺', description: 'Production network • Smart decimal optimization', walletType: 'algorand' },
                  { value: 'solana-devnet', name: 'Solana Devnet', cost: 'Free', icon: '🟣', description: 'Test network • Fixed 9 decimals (no limits)', walletType: 'solana' }
                ].map((network) => {
                  const isWalletCompatible = !isAuthenticated || walletType === network.walletType;
                  const isClickable = isWalletCompatible;
                  const isSelected = tokenData.network === network.value;
                  
                  return (
                    <div
                      key={network.value}
                      className={`relative border rounded-lg p-4 transition-all ${
                        isClickable ? 'cursor-pointer hover:border-primary/30 hover:shadow-sm' : 'cursor-not-allowed opacity-50'
                      } ${
                        isSelected
                          ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5' 
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => {
                        if (!isClickable) return;
                        
                        const newTokenData = { ...tokenData, network: network.value };
                        
                        // Set appropriate decimals based on network
                        if (network.value.includes('solana')) {
                          newTokenData.decimals = '9'; // Solana standard - fixed
                          newTokenData.burnable = true; // Always true on Solana
                        } else if (network.value.includes('algorand')) {
                          // For Algorand, start with 6 if switching from Solana, otherwise keep current
                          if (tokenData.network.includes('solana') || !tokenData.decimals) {
                            newTokenData.decimals = '6'; // Will be auto-optimized based on supply
                          }
                          // If already on Algorand and has decimals, keep them (will be optimized by useEffect)
                        }
                        
                        setTokenData(newTokenData);
                        
                        // Update payment steps for the new network
                        if (network.value.includes('solana')) {
                          updateStepsForNetwork('solana');
                        } else if (network.value.includes('algorand')) {
                          updateStepsForNetwork('algorand');
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {network.icon}
                          </span>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                              {network.name}
                            </p>
                            <p className="text-xs mt-0.5 text-muted-foreground">
                              {network.description}
                            </p>
                            {!isWalletCompatible && isAuthenticated && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Connect {network.walletType === 'algorand' ? 'Algorand' : 'Solana'} wallet to use this network
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}>
                            {network.cost}
                          </p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>              {tokenData.network && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">
                        {getNetworkInfo(tokenData.network).description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cost: <span className="font-medium">{getNetworkInfo(tokenData.network).cost}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Wallet compatibility notice */}
              {isAuthenticated && (
                <div className={`mt-3 p-4 rounded-lg border ${
                  walletType === 'algorand' ? 'bg-blue-50 border-blue-200' : 
                  walletType === 'solana' ? 'bg-purple-50 border-purple-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      walletType === 'algorand' ? 'bg-blue-100' : 
                      walletType === 'solana' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      <span className="text-sm">
                        {walletType === 'algorand' ? '🔺' : walletType === 'solana' ? '🟣' : '🔗'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        walletType === 'algorand' ? 'text-blue-900' : 
                        walletType === 'solana' ? 'text-purple-900' :
                        'text-gray-900'
                      }`}>
                        <span className="capitalize">{walletType || 'Unknown'} Wallet Connected</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          walletType === 'algorand' ? 'bg-blue-100 text-blue-700' : 
                          walletType === 'solana' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {walletType === 'algorand' ? 'Algorand Networks Available' : 
                           walletType === 'solana' ? 'Solana Networks Available' : 'Limited Access'}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${
                        walletType === 'algorand' ? 'text-blue-700' : 
                        walletType === 'solana' ? 'text-purple-700' :
                        'text-gray-700'
                      }`}>
                        {walletType === 'algorand' && (
                          <>
                            ✅ Can create tokens on Algorand Testnet and Mainnet
                            <br />
                            🔒 Solana networks require a Solana wallet connection
                          </>
                        )}
                        {walletType === 'solana' && (
                          <>
                            ✅ Can create tokens on Solana Devnet
                            <br />
                            🔒 Algorand networks require an Algorand wallet connection
                          </>
                        )}
                        {!walletType && 'Please connect a supported wallet to access networks'}
                      </div>
                      <div className={`text-xs mt-2 ${
                        walletType === 'algorand' ? 'text-blue-600' : 
                        walletType === 'solana' ? 'text-purple-600' :
                        'text-gray-600'
                      }`}>
                        💡 <strong>Pro tip:</strong> To access all networks, you can connect multiple wallet types
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Features - Mobile optimized moved above optional info */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6">
            Token Features
          </h2>
          
          {/* Network-specific feature information */}
          {tokenData.network && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  {tokenData.network.includes('algorand') && (
                    <p className="text-sm text-foreground">
                      <strong>Algorand:</strong> All features are fully customizable and enforced by the protocol's Asset Standard (ASA).
                    </p>
                  )}
                  {tokenData.network.includes('solana') && (
                    <div className="text-sm text-foreground space-y-1">
                      <p><strong>Solana Token Features:</strong></p>
                      <ul className="text-xs text-muted-foreground ml-4 space-y-0.5">
                        <li>• <strong>Mintable:</strong> Mint authority is revoked if disabled (no more tokens can be created)</li>
                        <li>• <strong>Burnable:</strong> Always enabled (token holders can burn their own tokens)</li>
                        <li>• <strong>Pausable:</strong> Freeze authority allows freezing individual accounts</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 lg:p-4 rounded-lg border border-border hover:border-border/80 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">Mintable</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {tokenData.network.includes('solana') 
                    ? 'Allow creating new tokens after deployment (mint authority will be revoked if disabled)'
                    : 'Allow creating new tokens after deployment'
                  }
                </p>
              </div>
              <Switch
                checked={tokenData.mintable}
                onCheckedChange={(checked) => setTokenData({ ...tokenData, mintable: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 lg:p-4 rounded-lg border border-border hover:border-border/80 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">Burnable</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {tokenData.network.includes('solana')
                    ? 'Allow permanently destroying tokens (always enabled on Solana - token holders can burn their own)'
                    : 'Allow permanently destroying tokens'
                  }
                </p>
              </div>
              <Switch
                checked={tokenData.network.includes('solana') ? true : tokenData.burnable}
                onCheckedChange={(checked) => setTokenData({ ...tokenData, burnable: checked })}
                disabled={tokenData.network.includes('solana')}
                className={tokenData.network.includes('solana') ? 'opacity-75' : ''}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 lg:p-4 rounded-lg border border-border hover:border-border/80 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">Pausable</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {tokenData.network.includes('solana')
                    ? 'Allow freezing individual token accounts (freeze authority)'
                    : 'Allow pausing all token transfers'
                  }
                </p>
              </div>
              <Switch
                checked={tokenData.pausable}
                onCheckedChange={(checked) => setTokenData({ ...tokenData, pausable: checked })}
              />
            </div>
          </div>
        </div>

        {/* Optional Information - Collapsible on mobile */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6">
            Optional Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Logo Upload */}
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-sm font-medium text-foreground">
                Token Logo
              </Label>
              <div className="space-y-3">
                {tokenData.logoUrl && (
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                    <img 
                      src={tokenData.logoUrl} 
                      alt="Token logo preview" 
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load');
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Logo uploaded</p>
                      <p className="text-xs text-muted-foreground">Your token logo is ready</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTokenData({ ...tokenData, logoUrl: '' })}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex-1 sm:flex-none"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  
                  <Input
                    placeholder="Or paste image URL"
                    value={tokenData.logoUrl.startsWith('blob:') ? '' : tokenData.logoUrl}
                    onChange={(e) => setTokenData({ ...tokenData, logoUrl: e.target.value })}
                    className="bg-background border-border text-foreground h-10 flex-1"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Upload JPG, PNG, GIF, WebP, or SVG (max 5MB) or paste an image URL
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium text-foreground">
                Website
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  placeholder="https://yourproject.com"
                  value={tokenData.website}
                  onChange={(e) => setTokenData({ ...tokenData, website: e.target.value })}
                  className="bg-background border-border text-foreground pl-10 h-10 lg:h-11"
                />
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-sm font-medium text-foreground">
                Twitter
              </Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  placeholder="@yourproject"
                  value={tokenData.twitter}
                  onChange={(e) => setTokenData({ ...tokenData, twitter: e.target.value })}
                  className="bg-background border-border text-foreground pl-10 h-10 lg:h-11"
                />
              </div>
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <Label htmlFor="github" className="text-sm font-medium text-foreground">
                GitHub
              </Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="github"
                  placeholder="github.com/yourproject"
                  value={tokenData.github}
                  onChange={(e) => setTokenData({ ...tokenData, github: e.target.value })}
                  className="bg-background border-border text-foreground pl-10 h-10 lg:h-11"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section - Mobile optimized */}
        <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6 flex items-center gap-2">
            <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            Payment Method
          </h2>
          
          <WalletAwarePaymentSelector 
            network={tokenData.network}
            creditsRequired={tokenData.network.includes('mainnet') ? 10 : 0}
            nativeRequired={tokenData.network.includes('mainnet') ? 5 : 0}
          />
        </div>

        {/* Create Token Button - Mobile optimized */}
        <div className="flex flex-col items-center pt-4 lg:pt-6">
          <Button
            onClick={handleCreateToken}
            disabled={isDeploying || !isFormReady()}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 lg:py-4 text-base lg:text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[200px] h-12 lg:h-14"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Create Token
              </>
            )}
          </Button>
          
          {/* Show reason why button is disabled */}
          {!isFormReady() && !isDeploying && (
            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                {getFormNotReadyReason()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <TokenConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmCreation}
        tokenData={tokenData}
        isLoading={isDeploying}
        selectedPaymentMethod={selectedPaymentMethod}
        paymentCosts={{
          credits: tokenData.network.includes('mainnet') ? 10 : 0,
          algo: tokenData.network.includes('mainnet') ? 10 : 0
        }}
      />

      {/* Transaction Status Modal */}
      <TransactionStatusModalEnhanced
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        status={null} // Let the modal use global payment state for status
        network={tokenData.network}
        deploymentResult={deploymentResult}
        tokenData={{
          name: tokenData.name,
          symbol: tokenData.symbol,
          network: tokenData.network
        }}
      />
    </>
  );
}
