'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, CheckCircle, Loader2, ExternalLink, CreditCard, Globe, Twitter, Github, Upload, X, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { hasEnoughCredits, spendCreditsForTokenCreation } from '@/lib/credit-system';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import PaymentSelectorNew, { type PaymentMethod } from '@/components/PaymentSelectorNew';
import MobilePaymentSelector from '@/components/MobilePaymentSelector';
import TransactionStatusModal, { type TransactionStatus } from '@/components/TransactionStatusModal';
import TransactionStatusModalEnhanced from '@/components/TransactionStatusModalEnhanced';
import { WalletConnectionGuard, WalletStatusIndicator } from '@/components/WalletConnectionGuard';
import { usePaymentState } from '@/hooks/usePaymentState';
import { isMobile } from '@/lib/mobile-wallet-utils';
import { 
  validatePaymentForTokenCreation, 
  executeTokenCreationPayment,
  getCreditsBalance
} from '@/lib/enhanced-payment-system';
import { trackTokenCreation, trackFeeCollection } from '@/lib/analytics';
import { createRealAlgorandToken, getMaximumSafeSupply, getPracticalMaximumSupply } from '@/lib/real-algorand-token-creation-v2';
import { getFeeConfigForNetwork } from '@/lib/admin-config';
import { createTokenWithMobileOptimizations, validateMobileWalletConnection } from '@/lib/mobile-token-creation';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
// Import token creation functions - will be implemented via existing components
// import { createAlgorandToken } from '@/lib/algorand';
// import { createTokenOnChain } from '@/lib/solana';

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

interface TokenFormNewProps {
  tokenData: TokenData;
  setTokenData: (data: TokenData) => void;
}

export default function TokenFormNew({ tokenData, setTokenData }: TokenFormNewProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'checking' | 'deploying' | 'success' | 'error'>('idle');
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewLogoUrl, setPreviewLogoUrl] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  
  // Transaction status modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('preparing');
  const [transactionError, setTransactionError] = useState<string>('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Use global payment state instead of local state
  const { 
    selectedMethod: selectedPaymentMethod,
    setProcessing,
    setTokenCreationStep,
    setError: setPaymentError,
    tokenCreationStep,
    isProcessing,
    steps
  } = usePaymentState();
  
  // Logo upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { walletAddress, isAuthenticated } = useWalletAuth();
  
  // Algorand wallet provider for real token creation
  const algorandWallet = useAlgorandWallet();

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  useEffect(() => {
    if (tokenData.logoUrl) {
      setPreviewLogoUrl(tokenData.logoUrl);
    }
  }, [tokenData.logoUrl]);

  // Load user credits
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!walletAddress) {
        setUserCredits(0);
        return;
      }
      
      try {
        const result = await getCreditsBalance(walletAddress);
        setUserCredits(result.success ? (result.balance || 0) : 0);
      } catch (error) {
        console.error('Error loading user credits:', error);
        setUserCredits(0);
      }
    };

    loadUserCredits();
  }, [walletAddress]);

  // File upload validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (PNG, JPG, GIF, WebP, or SVG)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  // Optimize image before upload
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate optimal dimensions (max 512x512)
        const maxSize = 512;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File from the blob
            const optimizedFile = blob as File;
            Object.defineProperty(optimizedFile, 'name', { value: file.name });
            Object.defineProperty(optimizedFile, 'lastModified', { value: Date.now() });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8); // 80% quality
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      // Optimize image
      setUploadProgress(20);
      const optimizedFile = await optimizeImage(file);
      
      setUploadProgress(40);
      
      // Import the upload function
      const { supabaseHelpers } = await import('@/lib/supabase');
      
      // Upload file with progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const uploadResult = await supabaseHelpers.uploadFileToStorage(
        optimizedFile,
        'token-logos',
        `logo-${Date.now()}-${optimizedFile.name.replace(/\s+/g, '-')}`
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (uploadResult.success && uploadResult.url) {
        handleInputChange('logoUrl', uploadResult.url);
        setPreviewLogoUrl(uploadResult.url);
        
        toast({
          title: "Logo Uploaded Successfully!",
          description: uploadResult.url?.includes('filebase') 
            ? "Your logo has been uploaded to IPFS via Filebase."
            : uploadResult.url?.includes('supabase')
            ? "Your logo has been uploaded to Supabase storage."
            : "Your logo has been processed and is ready to use.",
        });
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    handleInputChange('logoUrl', '');
    setPreviewLogoUrl('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic form validation
    if (!tokenData.name.trim()) {
      errors.name = 'Token name is required';
    } else if (tokenData.name.length < 3) {
      errors.name = 'Token name must be at least 3 characters';
    } else if (tokenData.name.length > 50) {
      errors.name = 'Token name must be less than 50 characters';
    }

    if (!tokenData.symbol.trim()) {
      errors.symbol = 'Token symbol is required';
    } else if (tokenData.symbol.length < 2) {
      errors.symbol = 'Token symbol must be at least 2 characters';
    } else if (tokenData.symbol.length > 10) {
      errors.symbol = 'Token symbol must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/.test(tokenData.symbol)) {
      errors.symbol = 'Token symbol must contain only uppercase letters and numbers';
    }

    if (!tokenData.description.trim()) {
      errors.description = 'Token description is required';
    } else if (tokenData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (tokenData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    if (!tokenData.totalSupply.trim()) {
      errors.totalSupply = 'Total supply is required';
    } else {
      const supply = parseFloat(tokenData.totalSupply);
      if (isNaN(supply) || supply <= 0) {
        errors.totalSupply = 'Total supply must be a positive number';
      } else if (supply > Number.MAX_SAFE_INTEGER) {
        errors.totalSupply = 'Total supply is too large for safe processing';
      } else {
        // Network-specific supply limits with safe integer validation
        if (tokenData.network.startsWith('algorand')) {
          try {
            const decimals = parseInt(tokenData.decimals) || 0;
            
            // Check if the supply with decimals would exceed safe integer limits
            const maxSafeSupply = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, decimals));
            
            if (supply > maxSafeSupply) {
              errors.totalSupply = `Token supply of ${supply.toLocaleString()} with ${decimals} decimals exceeds safe limits. Maximum safe supply for ${decimals} decimals is ${maxSafeSupply.toLocaleString()}`;
            } else {
              // Also check against Algorand's uint64 maximum
              const totalWithDecimals = supply * Math.pow(10, decimals);
              const algorandMaxUint64 = 18446744073709551615;
              if (totalWithDecimals > algorandMaxUint64) {
                errors.totalSupply = `Total supply with ${decimals} decimals would exceed Algorand maximum (${algorandMaxUint64.toLocaleString()})`;
              }
            }
          } catch (e) {
            errors.totalSupply = 'Total supply value is invalid';
          }
        } else if (tokenData.network.startsWith('solana')) {
          // Solana uses u64 as well, but with decimals consideration
          try {
            const decimals = parseInt(tokenData.decimals) || 9;
            
            // Check if the supply with decimals would exceed safe integer limits
            const maxSafeSupply = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, decimals));
            
            if (supply > maxSafeSupply) {
              errors.totalSupply = `Token supply of ${supply.toLocaleString()} with ${decimals} decimals exceeds safe limits. Maximum safe supply for ${decimals} decimals is ${maxSafeSupply.toLocaleString()}`;
            } else {
              // Also check against Solana's uint64 maximum
              const totalWithDecimals = supply * Math.pow(10, decimals);
              const solanaMaxUint64 = 18446744073709551615;
              if (totalWithDecimals > solanaMaxUint64) {
                errors.totalSupply = `Total supply with ${decimals} decimals would exceed Solana maximum (${solanaMaxUint64.toLocaleString()})`;
              }
            }
          } catch (e) {
            errors.totalSupply = 'Total supply value is invalid';
          }
        }
        // For other networks, no artificial limit is applied
      }
    }

    if (tokenData.website && !/^https?:\/\/.+/.test(tokenData.website)) {
      errors.website = 'Website must be a valid URL starting with http:// or https://';
    }

    if (tokenData.twitter && !/^@?[A-Za-z0-9_]+$/.test(tokenData.twitter)) {
      errors.twitter = 'Twitter handle must contain only letters, numbers, and underscores';
    }

    if (tokenData.github && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(tokenData.github)) {
      errors.github = 'GitHub must be in format "username/repository"';
    }

    // Wallet connection validation
    if (!walletAddress) {
      errors.wallet = 'Please connect your wallet before deploying';
    }

    // Payment method validation
    if (!selectedPaymentMethod) {
      errors.payment = 'Please select a payment method';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof TokenData, value: string | boolean) => {
    setTokenData({ ...tokenData, [field]: value });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const getNetworkCost = (network: string): number => {
    switch (network) {
      case 'algorand-mainnet':
        return 5; // 5 credits for mainnet
      case 'algorand-testnet':
      case 'solana-devnet':
      case 'solana-testnet':
        return 0; // Free for testnets
      default:
        return 0;
    }
  };

  const getAlgoCost = (network: string): number => {
    const feeConfig = getFeeConfigForNetwork(network);
    return feeConfig.enabled ? (feeConfig.amount / 1000000) : 0; // Convert microALGO to ALGO
  };

  const handleDeploy = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before deploying.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setProcessing(true);
    setShowTransactionModal(true);
    setTransactionStatus('preparing');
    setTokenCreationStep(0); // Step 0: Preparing payment
    setTransactionError('');

    try {
      // Validate payment method
      if (!selectedPaymentMethod) {
        setTransactionStatus('error');
        setTransactionError('Please select a payment method before deploying');
        setPaymentError('Please select a payment method before deploying');
        toast({
          title: "Payment Method Required",
          description: "Please select a payment method before deploying",
          variant: "destructive",
        });
        return;
      }

      // Step 0: Show preparing status
      setTransactionStatus('preparing');
      setTokenCreationStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 1: Connecting wallet
      setTokenCreationStep(1);
      const paymentValidation = await validatePaymentForTokenCreation(
        walletAddress!,
        tokenData.network,
        selectedPaymentMethod
      );

      if (!paymentValidation.success) {
        setTransactionStatus('error');
        setTransactionError(paymentValidation.error || "Payment validation failed");
        setPaymentError(paymentValidation.error || "Payment validation failed");
        toast({
          title: "Payment Error",
          description: paymentValidation.error || "Payment validation failed",
          variant: "destructive",
        });
        return;
      }

      // Real token creation based on network
      let result;
      
      if (tokenData.network.includes('algorand')) {
        // Mobile-specific wallet validation
        const walletValidation = validateMobileWalletConnection(algorandWallet);
        if (!walletValidation.isValid) {
          toast({
            title: "Wallet Issue",
            description: walletValidation.message,
            variant: "destructive",
          });
          setTransactionStatus('error');
          setTransactionError(walletValidation.message || 'Wallet validation failed');
          setPaymentError(walletValidation.message || 'Wallet validation failed');
          return;
        }
        
        try {
          console.log('🔥 CREATING REAL ALGORAND TOKEN WITH MOBILE OPTIMIZATION');
          console.log('✅ Using wallet:', algorandWallet.address);
          
          // Use mobile-optimized token creation
          result = await createTokenWithMobileOptimizations(
            {
              name: tokenData.name,
              symbol: tokenData.symbol,
              description: tokenData.description,
              decimals: parseInt(tokenData.decimals),
              totalSupply: tokenData.totalSupply,
              logoUrl: tokenData.logoUrl || 'https://via.placeholder.com/150',
              website: tokenData.website,
              github: tokenData.github,
              twitter: tokenData.twitter,
              mintable: tokenData.mintable,
              burnable: tokenData.burnable,
              pausable: tokenData.pausable,
              network: tokenData.network
            },
            tokenData.network,
            algorandWallet,
            (status) => {
              // Enhanced status updates for mobile with global state integration
              setTransactionStatus(status.status || 'preparing');
              
              // Map status to step numbers
              if (status.status === 'preparing') setTokenCreationStep(0);
              else if (status.status === 'signing') {
                setTokenCreationStep(2); // Step 2: Confirming transaction
                setTransactionStatus('signing');
              }
              else if (status.status === 'broadcasting') {
                setTokenCreationStep(3); // Step 3: Processing payment
                setTransactionStatus('broadcasting');
              }
              else if (status.status === 'confirming') {
                setTokenCreationStep(4); // Step 4: Finalizing
                setTransactionStatus('confirming');
              }
              
              if (status.message) {
                console.log(`📱 Mobile Status: ${status.message}`);
              }
              if (status.mobileHint) {
                console.log(`💡 Mobile Hint: ${status.mobileHint}`);
              }
            }
          );
          
          console.log('✅ REAL Algorand token creation with mobile optimization completed:', result.data);
          
        } catch (tokenError) {
          console.error('Mobile-optimized token creation failed:', tokenError);
          throw new Error(`Algorand token creation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
        
      } else if (tokenData.network.includes('solana')) {
        // Step 2: Confirming transaction
        setTransactionStatus('signing');
        setTokenCreationStep(2);
        
        console.log('🔥 CREATING REAL SOLANA TOKEN');
        
        try {
          // Import Solana token creation library - using the reliable direct method
          const { createTokenOnChain } = await import('@/lib/solana');
          
          // Get wallet interface for Solana
          const walletInterface = {
            publicKey: (window as any).solana?.publicKey,
            signTransaction: (window as any).solana?.signTransaction?.bind((window as any).solana),
            signAllTransactions: (window as any).solana?.signAllTransactions?.bind((window as any).solana)
          };
          
          if (!walletInterface.publicKey || !walletInterface.signTransaction) {
            throw new Error('Solana wallet not properly connected');
          }
          
          // Real Solana token creation using the reliable method
          result = await createTokenOnChain(walletInterface, {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            decimals: parseInt(tokenData.decimals),
            totalSupply: parseFloat(tokenData.totalSupply),
            logoUrl: tokenData.logoUrl || 'https://via.placeholder.com/150',
            website: tokenData.website,
            github: tokenData.github,
            twitter: tokenData.twitter,
            mintable: tokenData.mintable,
            burnable: tokenData.burnable,
            pausable: tokenData.pausable
          }, {
            onStepUpdate: (step, status, details) => {
              // Enhanced status updates - map to transaction status format
              if (status === 'in-progress') {
                if (step === 'wallet-check') {
                  setTransactionStatus('preparing');
                  setTokenCreationStep(1);
                } else if (step === 'transaction-prep') {
                  setTransactionStatus('signing');
                  setTokenCreationStep(2);
                } else if (step === 'transaction-send') {
                  setTransactionStatus('broadcasting');
                  setTokenCreationStep(3);
                } else if (step === 'confirmation') {
                  setTransactionStatus('confirming');
                  setTokenCreationStep(4);
                }
              } else if (status === 'completed') {
                setTransactionStatus('success');
                setTokenCreationStep(5);
              } else if (status === 'failed') {
                setTransactionStatus('error');
              }
              
              if (details?.message) {
                console.log(`📱 Solana Status: ${details.message}`);
              }
            }
          });
          
          console.log('✅ REAL Solana token creation completed:', result);
          
        } catch (tokenError) {
          console.error('Real Solana token creation failed:', tokenError);
          throw new Error(`Solana token creation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
        
      } else {
        throw new Error(`Unsupported network: ${tokenData.network}`);
      }

      if (result.success) {
        // Process payment based on selected method
        if (selectedPaymentMethod === 'credits') {
          const cost = paymentInfo?.amount || getNetworkCost(tokenData.network);
          if (cost > 0 && walletAddress) {
            await spendCreditsForTokenCreation(
              walletAddress,
              cost,
              `Token creation: ${tokenData.name} (${tokenData.symbol}) on ${tokenData.network}`
            );

            // Track fee collection analytics
            await trackFeeCollection({
              amount: cost,
              currency: 'credits',
              network: tokenData.network,
              transactionId: result.data?.transactionId || 'unknown'
            });
          }
        } else if (selectedPaymentMethod === 'algo_direct') {
          // Direct ALGO payment would be processed here
          console.log('Direct ALGO payment processed:', paymentInfo);
          
          // Track fee collection for direct payment
          const amount = paymentInfo?.amount || getAlgoCost(tokenData.network);
          if (amount > 0) {
            await trackFeeCollection({
              amount: amount,
              currency: 'ALGO',
              network: tokenData.network,
              transactionId: result.data?.transactionId || 'unknown'
            });
          }
        }

        // Track successful token creation analytics
        await trackTokenCreation({
          tokenName: tokenData.name,
          tokenSymbol: tokenData.symbol,
          network: tokenData.network,
          successful: true
        }, walletAddress!);

        setDeploymentResult(result.data);
        setTransactionStatus('success');
        setTokenCreationStep(4); // Complete all steps
        
        toast({
          title: "🎉 Token Created Successfully!",
          description: `${tokenData.name} (${tokenData.symbol}) has been deployed to ${tokenData.network}.`,
        });

        // DO NOT redirect to dashboard - stay on this page!
        console.log('✅ Token creation complete - staying on current page');
        
      } else {
        throw new Error('Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setTransactionStatus('error');
      setTransactionError(error instanceof Error ? error.message : "An unexpected error occurred during deployment.");
      setPaymentError(error instanceof Error ? error.message : "An unexpected error occurred during deployment.");
      
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during deployment.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
      setProcessing(false);
    }
  };

  const renderDeploymentStatus = () => {
    if (deploymentStatus === 'idle') return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {deploymentStatus === 'checking' && (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <div>
                  <h4 className="font-semibold">Checking Credits...</h4>
                  <p className="text-sm text-gray-400">Verifying your account balance</p>
                </div>
              </>
            )}
            
            {deploymentStatus === 'deploying' && (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                <div>
                  <h4 className="font-semibold">Deploying Token...</h4>
                  <p className="text-sm text-gray-400">Creating your token on the blockchain</p>
                </div>
              </>
            )}
            
            {deploymentStatus === 'success' && deploymentResult && (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-400">Token Deployed Successfully!</h4>
                  <p className="text-sm text-gray-400 mb-2">Your token is now live on {deploymentResult.network}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {deploymentResult.assetId && (
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Asset ID: {deploymentResult.assetId}
                      </Badge>
                    )}
                    {deploymentResult.mintAddress && (
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        Mint: {deploymentResult.mintAddress.slice(0, 8)}...{deploymentResult.mintAddress.slice(-8)}
                      </Badge>
                    )}
                    {deploymentResult.explorerUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
                      >
                        <a href={deploymentResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View on Explorer
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Redirecting to dashboard in a few seconds...
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {deploymentStatus === 'error' && (
              <>
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h4 className="font-semibold text-red-400">Deployment Failed</h4>
                  <p className="text-sm text-gray-400">Please check your inputs and try again</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <WalletConnectionGuard 
      requiredForNetworks={['algorand-mainnet', 'algorand-testnet']}
      currentNetwork={tokenData.network}
    >
      <div className="space-y-6">
        {/* Wallet Status Indicator */}
        <WalletStatusIndicator />
        
        {renderDeploymentStatus()}
      
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-400" />
            Basic Information
          </CardTitle>
          <CardDescription className="snarbles-body">
            Define the core properties of your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Name */}
          <div>
            <Label htmlFor="name" className="snarbles-body font-semibold">Token Name *</Label>
            <Input
              id="name"
              className="snarbles-input mt-2"
              placeholder="e.g., My Awesome Token"
              value={tokenData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            {validationErrors.name && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Token Symbol */}
          <div>
            <Label htmlFor="symbol" className="snarbles-body font-semibold">Token Symbol *</Label>
            <Input
              id="symbol"
              className="snarbles-input mt-2"
              placeholder="e.g., MAT"
              value={tokenData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
              maxLength={10}
            />
            {validationErrors.symbol && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.symbol}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="snarbles-body font-semibold">Description *</Label>
            <Textarea
              id="description"
              className="snarbles-input mt-2 min-h-[100px]"
              placeholder="Describe your token's purpose, utility, and vision..."
              value={tokenData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              {validationErrors.description ? (
                <p className="text-red-400 text-sm">{validationErrors.description}</p>
              ) : (
                <span />
              )}
              <span className="snarbles-body-small text-gray-400">{tokenData.description.length}/500</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection - Moved up for mobile UX */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4">Payment Method</CardTitle>
          <CardDescription className="snarbles-body-small text-gray-400">
            Choose how you want to pay for token creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMobileDevice ? (
            <MobilePaymentSelector
              creditsRequired={getNetworkCost(tokenData.network)}
              algoRequired={getAlgoCost(tokenData.network)}
              network={tokenData.network}
            />
          ) : (
            <PaymentSelectorNew
              creditsRequired={getNetworkCost(tokenData.network)}
              algoRequired={getAlgoCost(tokenData.network)}
              network={tokenData.network}
            />
          )}
          {validationErrors.payment && (
            <p className="text-red-400 text-sm mt-2">{validationErrors.payment}</p>
          )}
          {validationErrors.wallet && (
            <p className="text-red-400 text-sm mt-2">{validationErrors.wallet}</p>
          )}
        </CardContent>
      </Card>

      {/* Token Properties */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4">Token Properties</CardTitle>
          <CardDescription className="snarbles-body">
            Configure the technical aspects of your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Supply */}
            <div>
              <Label htmlFor="totalSupply" className="snarbles-body font-semibold">Total Supply *</Label>
              <p className="text-xs text-gray-400 mt-1 mb-2">
                Recommended: 1,000 to 1,000,000,000 tokens
              </p>
              <Input
                id="totalSupply"
                type="number"
                className="snarbles-input mt-2"
                placeholder="1000000"
                value={tokenData.totalSupply}
                min="1"
                max="1000000000000" // 1 trillion as reasonable max
                step="1"
                onChange={(e) => {
                  const value = e.target.value;
                  // Prevent input of extremely large numbers
                  if (value === '' || (parseFloat(value) <= 1000000000000000)) { // 1 quadrillion max
                    handleInputChange('totalSupply', value);
                  }
                }}
              />
              {validationErrors.totalSupply && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.totalSupply}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Current: {tokenData.totalSupply ? Number(tokenData.totalSupply).toLocaleString() : '0'} tokens
              </p>
            </div>

            {/* Decimals */}
            <div>
              <Label htmlFor="decimals" className="snarbles-body font-semibold">Decimals</Label>
              <Select
                value={tokenData.decimals}
                onValueChange={(value) => handleInputChange('decimals', value)}
              >
                <SelectTrigger className="snarbles-input mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (No decimals) - Recommended max: {getPracticalMaximumSupply(0).toLocaleString()}</SelectItem>
                  <SelectItem value="6">6 (Standard) - Recommended max: {getPracticalMaximumSupply(6).toLocaleString()}</SelectItem>
                  <SelectItem value="9">9 (Recommended) - Recommended max: {getPracticalMaximumSupply(9).toLocaleString()}</SelectItem>
                  <SelectItem value="8">8 (Bitcoin-like) - Recommended max: {getPracticalMaximumSupply(8).toLocaleString()}</SelectItem>
                  <SelectItem value="12">12 (High precision) - Recommended max: {getPracticalMaximumSupply(12).toLocaleString()}</SelectItem>
                  <SelectItem value="18">18 (ETH-like) - Recommended max: {getPracticalMaximumSupply(18).toLocaleString()}</SelectItem>
                </SelectContent>
              </Select>
              {tokenData.network.startsWith('algorand') && (
                <div className="text-xs text-gray-500 mt-1">
                  <div>Maximum safe supply: {getMaximumSafeSupply(parseInt(tokenData.decimals) || 0).toLocaleString()} tokens</div>
                  <div className="text-blue-400">Recommended max: {getPracticalMaximumSupply(parseInt(tokenData.decimals) || 0).toLocaleString()} tokens</div>
                </div>
              )}
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <Label className="snarbles-body font-semibold">Blockchain Network *</Label>
            <p className="text-sm text-gray-400 mt-1 mb-4">Choose the blockchain where your token will be deployed</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Algorand Testnet */}
              <button
                type="button"
                className={`relative snarbles-glass-subtle p-6 rounded-xl transition-all duration-300 group hover:scale-105 ${
                  tokenData.network === 'algorand-testnet'
                    ? 'snarbles-glow-green border-green-500/50'
                    : 'hover:border-green-500/30 hover:shadow-green-500/10'
                }`}
                onClick={() => handleInputChange('network', 'algorand-testnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'algorand-testnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 snarbles-gradient-green rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full snarbles-gradient-green flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="snarbles-heading font-semibold text-lg">Algorand</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Testnet</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Cost:</span>
                      <span className="snarbles-heading font-semibold text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Speed:</span>
                      <span className="snarbles-heading font-semibold">~3.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Security:</span>
                      <span className="snarbles-heading font-semibold text-yellow-400">Test Only</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="snarbles-body-small text-gray-300 mt-2">
                    Perfect for testing your token before mainnet deployment
                  </p>
                </div>
              </button>

              {/* Algorand Mainnet */}
              <button
                type="button"
                className={`relative snarbles-glass-subtle p-6 rounded-xl transition-all duration-300 group hover:scale-105 ${
                  tokenData.network === 'algorand-mainnet'
                    ? 'snarbles-glow-blue border-blue-500/50'
                    : 'hover:border-blue-500/30 hover:shadow-blue-500/10'
                }`}
                onClick={() => handleInputChange('network', 'algorand-mainnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'algorand-mainnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 snarbles-gradient-blue rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full snarbles-gradient-blue flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="snarbles-heading font-semibold text-lg">Algorand</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Mainnet</Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Cost:</span>
                      <span className="snarbles-heading font-semibold text-blue-400">5 Credits</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Speed:</span>
                      <span className="snarbles-heading font-semibold">~3.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Security:</span>
                      <span className="snarbles-heading font-semibold text-emerald-400">Production</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="snarbles-body-small text-gray-300 mt-2">
                    Production network for tokens with real value
                  </p>
                </div>
              </button>

              {/* Solana Devnet */}
              <button
                type="button"
                className={`relative snarbles-glass-subtle p-6 rounded-xl transition-all duration-300 group hover:scale-105 ${
                  tokenData.network === 'solana-devnet'
                    ? 'snarbles-glow-purple border-purple-500/50'
                    : 'hover:border-purple-500/30 hover:shadow-purple-500/10'
                }`}
                onClick={() => handleInputChange('network', 'solana-devnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'solana-devnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 snarbles-gradient-purple rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full snarbles-gradient-purple flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="snarbles-heading font-semibold text-lg">Solana</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Devnet</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Cost:</span>
                      <span className="snarbles-heading font-semibold text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Speed:</span>
                      <span className="snarbles-heading font-semibold">~400ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="snarbles-body-small text-gray-400">Security:</span>
                      <span className="snarbles-heading font-semibold text-yellow-400">Test Only</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="snarbles-body-small text-gray-300 mt-2">
                    High-speed testing environment for Solana development
                  </p>
                </div>
              </button>
            </div>
            
                         {/* Network Information & Cost Breakdown */}
             <div className="mt-6 space-y-4">
               {/* Network Comparison Helper */}
               <div className="snarbles-glass-subtle p-6 rounded-xl">
                 <div className="flex items-start gap-3">
                   <div className="w-8 h-8 rounded-xl snarbles-gradient-blue flex items-center justify-center flex-shrink-0">
                     <span className="text-white text-sm font-bold">?</span>
                   </div>
                   <div className="flex-1">
                     <h4 className="snarbles-heading font-semibold text-blue-400 mb-2">Need help choosing?</h4>
                     <p className="snarbles-body text-gray-300 mb-3">
                       Start with <strong className="text-green-400">testnet/devnet</strong> to test your token, then deploy to <strong className="text-blue-400">mainnet</strong> when ready for production.
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div className="flex items-center gap-2 snarbles-glass-subtle px-3 py-2 rounded-lg">
                         <div className="w-3 h-3 rounded-full snarbles-gradient-green"></div>
                         <span className="snarbles-body-small text-gray-300">Free networks = No real value</span>
                       </div>
                       <div className="flex items-center gap-2 snarbles-glass-subtle px-3 py-2 rounded-lg">
                         <div className="w-3 h-3 rounded-full snarbles-gradient-blue"></div>
                         <span className="snarbles-body-small text-gray-300">Mainnet = Real tokens with value</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Cost Breakdown for Paid Networks */}
               {getNetworkCost(tokenData.network) > 0 && (
                 <div className="snarbles-card-premium p-6 snarbles-glow-blue">
                   <div className="flex items-start gap-3">
                     <CreditCard className="w-6 h-6 text-blue-400 flex-shrink-0" />
                     <div className="flex-1">
                       <h4 className="snarbles-heading font-semibold text-blue-400 mb-3">Mainnet Deployment Cost</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                         <div className="flex justify-between">
                           <span className="text-gray-400">Platform Fee:</span>
                           <span className="font-semibold text-white">{getNetworkCost(tokenData.network)} Credits</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-400">Network Fee:</span>
                           <span className="font-semibold text-white">~$0.002</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-400">Total USD:</span>
                           <span className="font-semibold text-emerald-400">~$5.00</span>
                         </div>
                       </div>
                       <p className="text-xs text-gray-400 mt-2">
                         ⚡ Credits are deducted only after successful deployment
                       </p>
                     </div>
                   </div>
                 </div>
               )}

               {/* Solana-Specific Guidance */}
               {tokenData.network.includes('solana') && (
                 <div className="snarbles-card-premium p-6 snarbles-glow-purple">
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-xl snarbles-gradient-purple flex items-center justify-center flex-shrink-0">
                       <span className="text-white text-sm font-bold">S</span>
                     </div>
                     <div className="flex-1">
                       <h4 className="snarbles-heading font-semibold text-purple-400 mb-3">Solana Token Creation Guide</h4>
                       
                       <div className="space-y-3">
                         <div className="snarbles-glass-subtle p-4 rounded-lg">
                           <h5 className="snarbles-heading font-semibold text-green-400 mb-2">✅ Requirements</h5>
                           <ul className="snarbles-body-small text-gray-300 space-y-1">
                             <li>• Solana wallet connected (Phantom, Solflare, etc.)</li>
                             <li>• Minimum 0.01 SOL for transaction fees</li>
                             <li>• Token metadata (name, symbol, description)</li>
                           </ul>
                         </div>
                         
                         <div className="snarbles-glass-subtle p-4 rounded-lg">
                           <h5 className="snarbles-heading font-semibold text-blue-400 mb-2">⚡ What happens next?</h5>
                           <ul className="snarbles-body-small text-gray-300 space-y-1">
                             <li>• SPL token created using standard Solana token program</li>
                             <li>• Metadata uploaded to ensure proper display</li>
                             <li>• Token appears in your wallet immediately</li>
                             <li>• View on Solana Explorer for verification</li>
                           </ul>
                         </div>
                         
                         <div className="snarbles-glass-subtle p-4 rounded-lg">
                           <h5 className="snarbles-heading font-semibold text-yellow-400 mb-2">💡 Pro Tips</h5>
                           <ul className="snarbles-body-small text-gray-300 space-y-1">
                             <li>• Test on devnet first - it's completely free</li>
                             <li>• Use meaningful names and symbols</li>
                             <li>• Keep decimals at 9 for compatibility</li>
                             <li>• Enable mintable for future token issuance</li>
                           </ul>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Advanced Features */}
          <div className="space-y-4">
            <h4 className="snarbles-heading-5">Advanced Features</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 snarbles-glass-subtle rounded-lg border-0">
                <div>
                  <Label htmlFor="mintable" className="snarbles-body font-semibold">Mintable</Label>
                  <p className="snarbles-body-small text-gray-400">Allow creating more tokens after deployment</p>
                </div>
                <Switch
                  id="mintable"
                  checked={tokenData.mintable}
                  onCheckedChange={(checked) => handleInputChange('mintable', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 snarbles-glass-subtle rounded-lg border-0">
                <div>
                  <Label htmlFor="burnable" className="snarbles-body font-semibold">Burnable</Label>
                  <p className="text-sm text-gray-400">Allow permanent destruction of tokens</p>
                </div>
                <Switch
                  id="burnable"
                  checked={tokenData.burnable}
                  onCheckedChange={(checked) => handleInputChange('burnable', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 snarbles-glass-subtle rounded-lg border-0">
                <div>
                  <Label htmlFor="pausable" className="snarbles-body font-semibold">Pausable</Label>
                  <p className="snarbles-body-small text-gray-400">Allow pausing all token transfers</p>
                </div>
                <Switch
                  id="pausable"
                  checked={tokenData.pausable}
                  onCheckedChange={(checked) => handleInputChange('pausable', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pre-Deployment Checklist */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Pre-Deployment Checklist
          </CardTitle>
          <CardDescription className="snarbles-body-small text-gray-400">
            Complete all requirements before deploying your token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              tokenData.name && tokenData.symbol && tokenData.description && tokenData.totalSupply 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-gray-500/10 border border-gray-500/20'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                tokenData.name && tokenData.symbol && tokenData.description && tokenData.totalSupply
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-gray-300'
              }`}>
                {tokenData.name && tokenData.symbol && tokenData.description && tokenData.totalSupply ? '✓' : '1'}
              </div>
              <div>
                <p className="font-medium">Token Information Complete</p>
                <p className="text-sm text-gray-400">Name, symbol, description, and supply filled</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              walletAddress 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-gray-500/10 border border-gray-500/20'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                walletAddress
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-gray-300'
              }`}>
                {walletAddress ? '✓' : '2'}
              </div>
              <div>
                <p className="font-medium">Wallet Connected</p>
                <p className="text-sm text-gray-400">
                  {walletAddress ? `Connected: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Connect your wallet to deploy'}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              selectedPaymentMethod 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-gray-500/10 border border-gray-500/20'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                selectedPaymentMethod
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-gray-300'
              }`}>
                {selectedPaymentMethod ? '✓' : '3'}
              </div>
              <div>
                <p className="font-medium">Payment Method Selected</p>
                <p className="text-sm text-gray-400">
                  {selectedPaymentMethod 
                    ? `Selected: ${selectedPaymentMethod === 'credits' ? 'Credits' : 'Direct ALGO Payment'}`
                    : 'Choose how to pay for token creation'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <Card className="snarbles-card">
        <CardContent className="p-6">
          {(() => {
            const isFormComplete = tokenData.name && tokenData.symbol && tokenData.description && tokenData.totalSupply;
            const allRequirementsMet = isFormComplete && walletAddress && selectedPaymentMethod;
            
            return (
              <>
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || deploymentStatus === 'success' || !allRequirementsMet}
                  className={`w-full py-4 text-lg transition-all ${
                    allRequirementsMet && !isDeploying 
                      ? 'snarbles-btn-primary' 
                      : 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {deploymentStatus === 'checking' ? 'Checking Payment...' : 'Deploying Token...'}
                    </>
                  ) : deploymentStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Token Deployed Successfully!
                    </>
                  ) : allRequirementsMet ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Deploy Token
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Complete Requirements to Deploy
                    </>
                  )}
                </Button>
                
                {!allRequirementsMet && !isDeploying && deploymentStatus !== 'success' && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium mb-1">Missing Requirements:</p>
                    <ul className="text-yellow-300 text-xs space-y-1">
                      {!isFormComplete && <li>• Complete token information form</li>}
                      {!walletAddress && <li>• Connect your wallet</li>}
                      {!selectedPaymentMethod && <li>• Select a payment method</li>}
                    </ul>
                  </div>
                )}
                
                {getNetworkCost(tokenData.network) === 0 && allRequirementsMet && (
                  <p className="text-center text-sm text-green-400 mt-2">
                    Free deployment on {tokenData.network}
                  </p>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Optional Information - Moved to end for better mobile UX */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4">Optional Information</CardTitle>
          <CardDescription className="snarbles-body">
            Add social links and branding to enhance your token's credibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <Label className="snarbles-body font-semibold">Token Logo</Label>
            <p className="text-sm text-gray-400 mt-1 mb-4">Upload an image or provide a URL for your token logo</p>
            
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : isUploading
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : previewLogoUrl
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              {isUploading ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-400">Uploading Logo...</h4>
                    <p className="text-sm text-gray-400 mt-1">Processing and optimizing your image</p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : previewLogoUrl ? (
                <div className="text-center space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <img
                      src={previewLogoUrl}
                      alt="Token logo"
                      className="w-full h-full object-cover rounded-xl border-2 border-green-500/50"
                      onError={() => setPreviewLogoUrl('')}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400">Logo Ready!</h4>
                    <p className="text-sm text-gray-400">Click to upload a new image</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Logo
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Upload Token Logo</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Drag and drop an image here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, GIF, WebP, or SVG • Max 5MB • Optimal: 512x512px
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-600 hover:border-gray-500"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
            
            {/* Upload Error */}
            {uploadError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">Upload Failed</p>
                    <p className="text-xs text-red-300 mt-1">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Alternative URL Input */}
            <div className="mt-4">
              <Label className="text-sm text-gray-400">Or provide a logo URL</Label>
              <Input
                className="snarbles-input mt-2"
                placeholder="https://example.com/logo.png"
                value={tokenData.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="website" className="snarbles-body font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="website"
                className="snarbles-input mt-2"
                placeholder="https://yourproject.com"
                value={tokenData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
              {validationErrors.website && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.website}</p>
              )}
            </div>

            <div>
              <Label htmlFor="twitter" className="snarbles-body font-semibold flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                className="snarbles-input mt-2"
                placeholder="@username"
                value={tokenData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
              />
              {validationErrors.twitter && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.twitter}</p>
              )}
            </div>

            <div>
              <Label htmlFor="github" className="snarbles-body font-semibold flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </Label>
              <Input
                id="github"
                className="snarbles-input mt-2"
                placeholder="username/repository"
                value={tokenData.github}
                onChange={(e) => handleInputChange('github', e.target.value)}
              />
              {validationErrors.github && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.github}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Transaction Status Modal for Mobile */}
      <TransactionStatusModalEnhanced
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        status={transactionStatus}
        deploymentResult={deploymentResult}
        error={transactionError}
        onRetry={() => {
          setTransactionStatus('preparing');
          setTransactionError('');
          handleDeploy();
        }}
        network={tokenData.network}
        tokenData={{
          name: tokenData.name,
          symbol: tokenData.symbol,
          network: tokenData.network
        }}
      />
    </div>
    </WalletConnectionGuard>
  );
}
