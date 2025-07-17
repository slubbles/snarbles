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
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import PaymentSelectorNew, { type PaymentMethod } from '@/components/PaymentSelectorNew';
import TokenCreationProgress from '@/components/TokenCreationProgress';
import TokenCreationSuccess from '@/components/TokenCreationSuccess';
import { useTokenCreationProgress } from '@/hooks/useTokenCreationProgress';
import { 
  validatePaymentForTokenCreation, 
  executeTokenCreationPayment,
  getCreditsBalance
} from '@/lib/enhanced-payment-system';
import { createTokenWithRealTransaction } from '@/lib/real-algorand-token-creation';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('credits');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  
  // Progress and success modal states
  const [showProgress, setShowProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTokenData, setCreatedTokenData] = useState<any>(null);
  const { progress, steps, updateProgress, resetProgress, setError, setSuccess } = useTokenCreationProgress();
  
  // Logo upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { walletAddress, isAuthenticated } = useWalletAuth();
  const { peraWallet } = useAlgorandWallet();

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
      } else if (supply > 1e15) {
        errors.totalSupply = 'Total supply is too large';
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
    switch (network) {
      case 'algorand-mainnet':
        return 10; // 10 ALGO for direct payment
      case 'algorand-testnet':
      case 'solana-devnet':
      case 'solana-testnet':
        return 0; // Free for testnets
      default:
        return 0;
    }
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

    if (!walletAddress || !peraWallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera wallet to deploy tokens.",
        variant: "destructive",
      });
      return;
    }

    // Reset progress and show modal
    resetProgress();
    setShowProgress(true);
    setIsDeploying(true);

    try {
      // Step 1: Preparing transaction
      updateProgress(0, 'preparing');
      
      // Validate payment method
      const paymentValidation = await validatePaymentForTokenCreation(
        walletAddress,
        tokenData.network,
        selectedPaymentMethod
      );

      if (!paymentValidation.success) {
        throw new Error(paymentValidation.error || "Payment validation failed");
      }

      // Prepare token parameters for real creation
      const tokenParams = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        totalSupply: parseInt(tokenData.totalSupply),
        decimals: parseInt(tokenData.decimals),
        logoUrl: tokenData.logoUrl,
        website: tokenData.website,
        network: tokenData.network
      };

      // Simulate preparation time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Request wallet signature
      updateProgress(1, 'signing');

      // Create signing function for Pera wallet
      const signTransaction = async (txn: any) => {
        try {
          const signedTxns = await peraWallet.signTransaction([txn]);
          return signedTxns[0];
        } catch (error) {
          throw new Error('User cancelled transaction or signing failed');
        }
      };

      // Step 3: Create token with real transaction
      updateProgress(2, 'broadcasting');
      
      const result = await createTokenWithRealTransaction(
        tokenParams,
        walletAddress,
        signTransaction
      );

      if (!result.success) {
        throw new Error(result.error || 'Token creation failed');
      }

      // Step 4: Confirming
      updateProgress(3, 'confirming');
      
      // Wait a bit more for network confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 5: Success
      setSuccess({
        txId: result.transactionId!,
        assetId: result.assetId!
      });

      // Process payment after successful creation
      if (selectedPaymentMethod === 'credits') {
        const cost = paymentInfo?.amount || 5; // Default to 5 credits
        if (cost > 0) {
          await spendCreditsForTokenCreation(
            walletAddress,
            cost,
            `Token creation: ${tokenData.name} (${tokenData.symbol}) on ${tokenData.network}`
          );
        }
      }

      // Prepare success modal data
      setCreatedTokenData({
        name: tokenData.name,
        symbol: tokenData.symbol,
        assetId: result.assetId,
        transactionId: result.transactionId,
        explorerUrl: result.explorerUrl,
        network: tokenData.network,
        decimals: parseInt(tokenData.decimals),
        totalSupply: parseInt(tokenData.totalSupply)
      });

      // Hide progress modal and show success
      setTimeout(() => {
        setShowProgress(false);
        setShowSuccess(true);
      }, 2000);

      toast({
        title: "Token Created Successfully!",
        description: `Your token "${tokenData.name}" has been deployed to ${tokenData.network}.`,
      });

    } catch (error) {
      console.error('Deployment error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during deployment.";
      
      setError(errorMessage);
      
      toast({
        title: "Deployment Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
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
                  <p className="text-sm text-gray-400 mb-2">Your token is now live on the blockchain</p>
                  {deploymentResult.assetId && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Asset ID: {deploymentResult.assetId}</Badge>
                      {deploymentResult.explorerUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={deploymentResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View on Explorer
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
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
    <div className="space-y-4 md:space-y-6">
      {renderDeploymentStatus()}
      
      <Card className="glass-card">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm md:text-base">
            Define the core properties of your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Token Name */}
          <div>
            <Label htmlFor="name" className="text-foreground font-semibold text-sm md:text-base">Token Name *</Label>
            <Input
              id="name"
              className="bg-background border-border text-foreground focus:border-primary mt-2 h-11 md:h-10 text-base md:text-sm"
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
            <Label htmlFor="symbol" className="text-foreground font-semibold text-sm md:text-base">Token Symbol *</Label>
            <Input
              id="symbol"
              className="bg-background border-border text-foreground focus:border-primary mt-2 h-11 md:h-10 text-base md:text-sm"
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
            <Label htmlFor="description" className="text-foreground font-semibold text-sm md:text-base">Description *</Label>
            <Textarea
              id="description"
              className="bg-background border-border text-foreground focus:border-primary mt-2 min-h-[100px] md:min-h-[100px] text-base md:text-sm"
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
              <span className="text-muted-foreground text-sm">{tokenData.description.length}/500</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Properties */}
      <Card className="glass-card">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">Token Properties</CardTitle>
          <CardDescription className="text-muted-foreground text-sm md:text-base">
            Configure the technical aspects of your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Total Supply */}
            <div>
              <Label htmlFor="totalSupply" className="text-foreground font-semibold text-sm md:text-base">Total Supply *</Label>
              <Input
                id="totalSupply"
                type="number"
                className="bg-background border-border text-foreground focus:border-primary mt-2 h-11 md:h-10 text-base md:text-sm"
                placeholder="1000000"
                value={tokenData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
              />
              {validationErrors.totalSupply && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.totalSupply}</p>
              )}
            </div>

            {/* Decimals */}
            <div>
              <Label htmlFor="decimals" className="text-foreground font-semibold text-sm md:text-base">Decimals</Label>
              <Select
                value={tokenData.decimals}
                onValueChange={(value) => handleInputChange('decimals', value)}
              >
                <SelectTrigger className="bg-background border-border text-foreground focus:border-primary mt-2 h-11 md:h-10 text-base md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (No decimals)</SelectItem>
                  <SelectItem value="6">6 (Standard)</SelectItem>
                  <SelectItem value="9">9 (Recommended)</SelectItem>
                  <SelectItem value="18">18 (ETH-like)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <Label className="text-foreground font-semibold text-sm md:text-base">Blockchain Network *</Label>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Choose the blockchain where your token will be deployed</p>
            
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {/* Algorand Testnet */}
              <button
                type="button"
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl ${
                  tokenData.network === 'algorand-testnet'
                    ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20 transform scale-[1.02]'
                    : 'border-gray-700 bg-gray-800/50 hover:border-green-500/50 hover:bg-green-500/5 hover:shadow-green-500/10'
                }`}
                onClick={() => handleInputChange('network', 'algorand-testnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'algorand-testnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
                  <span className="text-green-400 font-bold text-xl">A</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Algorand</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Testnet</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cost:</span>
                      <span className="font-semibold text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Speed:</span>
                      <span className="font-semibold">~3.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Security:</span>
                      <span className="font-semibold text-yellow-400">Test Only</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-400 mt-2">
                    Perfect for testing your token before mainnet deployment
                  </p>
                </div>
              </button>

              {/* Algorand Mainnet */}
              <button
                type="button"
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl ${
                  tokenData.network === 'algorand-mainnet'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 transform scale-[1.02]'
                    : 'border-gray-700 bg-gray-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-emerald-500/10'
                }`}
                onClick={() => handleInputChange('network', 'algorand-mainnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'algorand-mainnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 mx-auto">
                  <span className="text-emerald-400 font-bold text-xl">A</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Algorand</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Mainnet</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cost:</span>
                      <span className="font-semibold text-emerald-400">5 Credits</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Speed:</span>
                      <span className="font-semibold">~3.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Security:</span>
                      <span className="font-semibold text-emerald-400">Production</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-400 mt-2">
                    Production network for tokens with real value
                  </p>
                </div>
              </button>

              {/* Solana Devnet */}
              <button
                type="button"
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl ${
                  tokenData.network === 'solana-devnet'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 transform scale-[1.02]'
                    : 'border-gray-700 bg-gray-800/50 hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-purple-500/10'
                }`}
                onClick={() => handleInputChange('network', 'solana-devnet')}
              >
                {/* Selected Indicator */}
                {tokenData.network === 'solana-devnet' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Network Icon */}
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 mx-auto">
                  <span className="text-purple-400 font-bold text-xl">S</span>
                </div>
                
                {/* Network Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Solana</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Devnet</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live</Badge>
                  </div>
                  
                  {/* Cost & Speed */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cost:</span>
                      <span className="font-semibold text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Speed:</span>
                      <span className="font-semibold">~400ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Security:</span>
                      <span className="font-semibold text-yellow-400">Test Only</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-400 mt-2">
                    High-speed testing environment for Solana development
                  </p>
                </div>
              </button>
            </div>
            
                         {/* Network Information & Cost Breakdown */}
             <div className="mt-6 space-y-4">
               {/* Network Comparison Helper */}
               <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                 <div className="flex items-start gap-3">
                   <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                     <span className="text-blue-400 text-xs">?</span>
                   </div>
                   <div className="flex-1">
                     <h4 className="font-semibold text-blue-400 mb-1">Need help choosing?</h4>
                     <p className="text-sm text-gray-400 mb-2">
                       Start with <strong>testnet/devnet</strong> to test your token, then deploy to <strong>mainnet</strong> when ready for production.
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                         <span>Free networks = No real value</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                         <span>Mainnet = Real tokens with value</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Cost Breakdown for Paid Networks */}
               {getNetworkCost(tokenData.network) > 0 && (
                 <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg">
                   <div className="flex items-start gap-3">
                     <CreditCard className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                     <div className="flex-1">
                       <h4 className="font-semibold text-emerald-400 mb-2">Mainnet Deployment Cost</h4>
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
             </div>
          </div>

          {/* Advanced Features */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-foreground">Advanced Features</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label htmlFor="mintable" className="text-foreground font-semibold">Mintable</Label>
                  <p className="text-sm text-muted-foreground">Allow creating more tokens after deployment</p>
                </div>
                <Switch
                  id="mintable"
                  checked={tokenData.mintable}
                  onCheckedChange={(checked) => handleInputChange('mintable', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label htmlFor="burnable" className="text-foreground font-semibold">Burnable</Label>
                  <p className="text-sm text-muted-foreground">Allow permanent destruction of tokens</p>
                </div>
                <Switch
                  id="burnable"
                  checked={tokenData.burnable}
                  onCheckedChange={(checked) => handleInputChange('burnable', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label htmlFor="pausable" className="text-foreground font-semibold">Pausable</Label>
                  <p className="text-sm text-muted-foreground">Allow pausing all token transfers</p>
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

      {/* Optional Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">Optional Information</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add social links and branding to enhance your token's credibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <Label className="text-foreground font-semibold">Token Logo</Label>
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
              <Label className="text-sm text-muted-foreground">Or provide a logo URL</Label>
              <Input
                className="bg-background border-border text-foreground focus:border-primary mt-2"
                placeholder="https://example.com/logo.png"
                value={tokenData.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="website" className="text-foreground font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="website"
                className="bg-background border-border text-foreground focus:border-primary mt-2"
                placeholder="https://yourproject.com"
                value={tokenData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
              {validationErrors.website && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.website}</p>
              )}
            </div>

            <div>
              <Label htmlFor="twitter" className="text-foreground font-semibold flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Label>
              <Input
                id="twitter"
                className="bg-background border-border text-foreground focus:border-primary mt-2"
                placeholder="@username"
                value={tokenData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
              />
              {validationErrors.twitter && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.twitter}</p>
              )}
            </div>

            <div>
              <Label htmlFor="github" className="text-foreground font-semibold flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </Label>
              <Input
                id="github"
                className="bg-background border-border text-foreground focus:border-primary mt-2"
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

      {/* Payment Method Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4">Payment Method</CardTitle>
          <CardDescription className="snarbles-body-small text-gray-400">
            Choose how you want to pay for token creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSelectorNew
            creditsRequired={5}
            algoRequired={10}
            network={tokenData.network}
          />
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <Card className="snarbles-card">
        <CardContent className="p-6">
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || deploymentStatus === 'success'}
            className="w-full snarbles-btn-primary py-4 text-lg"
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
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Deploy Token
              </>
            )}
          </Button>
          
          {getNetworkCost(tokenData.network) === 0 && (
            <p className="text-center text-sm text-green-400 mt-2">
              Free deployment on {tokenData.network}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Progress Modal */}
      {showProgress && (
        <TokenCreationProgress
          progress={progress}
          steps={steps}
          onClose={() => setShowProgress(false)}
          onCancel={() => {
            setShowProgress(false);
            setIsDeploying(false);
            resetProgress();
          }}
          canClose={progress.status === 'error' || progress.status === 'success'}
        />
      )}

      {/* Success Modal */}
      {showSuccess && createdTokenData && (
        <TokenCreationSuccess
          tokenData={createdTokenData}
          onClose={() => {
            setShowSuccess(false);
            setCreatedTokenData(null);
          }}
          onCreateAnother={() => {
            setShowSuccess(false);
            setCreatedTokenData(null);
            // Reset form
            setTokenData({
              name: '',
              symbol: '',
              description: '',
              totalSupply: '',
              decimals: '6',
              logoUrl: '',
              website: '',
              twitter: '',
              github: '',
              mintable: false,
              burnable: false,
              pausable: false,
              network: tokenData.network
            });
            setPreviewLogoUrl('');
            resetProgress();
          }}
          onGoToDashboard={() => {
            setShowSuccess(false);
            router.push('/dashboard');
          }}
        />
      )}
    </div>
  );
}
