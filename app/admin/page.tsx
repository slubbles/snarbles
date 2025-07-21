'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { initializePlatform, getPlatformState, ADMIN_WALLET } from '@/lib/solana';
import { 
  getAllPricingConfigs, 
  updatePricingConfig, 
  getPricingHistory,
  getFeeCollectionSummary,
  validateWalletAddress,
  formatFeeAmount,
  type PricingConfig,
  type PricingHistory,
  type FeeCollectionSummary
} from '@/lib/dynamic-pricing';
import { 
  getAdminConfig, 
  updateAdminConfig, 
  isAdmin,
  type AdminConfig 
} from '@/lib/admin-config';
import { 
  AlertTriangle, CheckCircle, Settings, Loader2, Shield, 
  Wallet, ArrowLeft, Rocket, BarChart3, Activity, 
  PieChart, Info, FileText, Crown, Zap, Sparkles,
  Database, Server, Lock, Users, DollarSign, Edit,
  Save, X, History, TrendingUp, Coins, Globe
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  // Solana platform states
  const [creationFee, setCreationFee] = useState('0');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCheckingState, setIsCheckingState] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);
  const [stateInfo, setStateInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Platform Analytics States
  const [platformStats, setPlatformStats] = useState({
    totalTokens: 0,
    totalTransactions: 0,
    totalRevenue: '0',
    activeUsers: 0,
    avgTokenCreationTime: '0s',
    successRate: 0,
    networksSupported: 2,
    totalVerifications: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  // Admin Controls States
  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    tokenCreationEnabled: true,
    verificationEnabled: true,
    newUserRegistration: true,
    emergencyStop: false,
    maxTokensPerUser: 100,
    featureFlags: {
      algorandSupport: true,
      solanaSupport: true,
      advancedFeatures: true,
      betaFeatures: false
    }
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Dynamic pricing states
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PricingConfig>>({});
  const [pricingHistory, setPricingHistory] = useState<PricingHistory[]>([]);
  const [feeCollectionSummary, setFeeCollectionSummary] = useState<FeeCollectionSummary[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [pricingError, setPricingError] = useState('');

  // Algorand fee management states
  const [algorandConfig, setAlgorandConfig] = useState<AdminConfig | null>(null);
  const [editingAlgorandFees, setEditingAlgorandFees] = useState(false);
  const [savingAlgorandFees, setSavingAlgorandFees] = useState(false);
  const [algorandFeeForm, setAlgorandFeeForm] = useState({
    mainnetFee: '10',
    testnetFee: '0'
  });

  // Solana wallet
  const { connected, publicKey, wallet, signTransaction, signAllTransactions } = useWallet();
  const { toast } = useToast();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load pricing configurations
  useEffect(() => {
    if (mounted && connected && publicKey && publicKey.toString() === ADMIN_WALLET.toString()) {
      loadPricingData();
      loadPlatformAnalytics();
      loadPlatformSettings();
      loadAlgorandConfig();
    }
  }, [mounted, connected, publicKey]);

  const loadPlatformAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Import analytics functions
      const { getPlatformAnalytics, getRecentActivity, getFallbackAnalytics } = await import('@/lib/analytics');
      
      // Try to get real analytics data from Supabase first
      const analyticsResult = await getPlatformAnalytics(selectedTimeframe as '24h' | '7d' | '30d' | '90d');
      
      if (analyticsResult.success && analyticsResult.data) {
        setPlatformStats(analyticsResult.data);
      } else {
        // Fallback to localStorage-based analytics
        const fallbackResult = getFallbackAnalytics(selectedTimeframe as '24h' | '7d' | '30d' | '90d');
        if (fallbackResult.success && fallbackResult.data) {
          setPlatformStats(fallbackResult.data);
        } else {
          // Final fallback to basic mock data with indicator
          const basicStats = {
            totalTokens: 0,
            totalTransactions: 0,
            totalRevenue: '0.00',
            activeUsers: 0,
            avgTokenCreationTime: '0s',
            successRate: 100,
            networksSupported: 2,
            totalVerifications: 0
          };
          setPlatformStats(basicStats);
        }
      }

      // Get recent activity
      const activityResult = await getRecentActivity(10);
      if (activityResult.success) {
        setRecentActivity(activityResult.data);
      } else {
        // Fallback to localStorage recent activity
        try {
          const localEvents = JSON.parse(localStorage.getItem('snarbles-analytics-events') || '[]');
          const recentLocalActivity = localEvents
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, 4)
            .map((event: any) => ({
              type: event.event_name || 'unknown',
              user: event.wallet_address ? `${event.wallet_address.slice(0, 6)}...${event.wallet_address.slice(-4)}` : 'Anonymous',
              network: event.event_properties?.network || 'unknown',
              timestamp: event.timestamp || Date.now(),
              tokenId: event.event_properties?.tokenId || event.event_properties?.tokenName,
              amount: event.event_properties?.amount ? 
                `${event.event_properties.amount} ${event.event_properties.currency || ''}` : 
                undefined
            }));
          setRecentActivity(recentLocalActivity);
        } catch {
          setRecentActivity([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set empty/default state on error
      setPlatformStats({
        totalTokens: 0,
        totalTransactions: 0,
        totalRevenue: '0.00',
        activeUsers: 0,
        avgTokenCreationTime: '0s',
        successRate: 100,
        networksSupported: 2,
        totalVerifications: 0
      });
      setRecentActivity([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      // Load current platform settings from your backend
      // This is a mock implementation
      const settings = {
        maintenanceMode: false,
        tokenCreationEnabled: true,
        verificationEnabled: true,
        newUserRegistration: true,
        emergencyStop: false,
        maxTokensPerUser: 100,
        featureFlags: {
          algorandSupport: true,
          solanaSupport: true,
          advancedFeatures: true,
          betaFeatures: false
        }
      };
      setPlatformSettings(settings);
    } catch (error) {
      console.error('Error loading platform settings:', error);
    }
  };

  const savePlatformSettings = async () => {
    setSavingSettings(true);
    try {
      // Save platform settings to your backend
      // This is a mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Platform settings have been updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save platform settings",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const loadPricingData = async () => {
    setLoadingPricing(true);
    try {
      // Load pricing configurations
      const configsResult = await getAllPricingConfigs();
      if (configsResult.success && configsResult.data) {
        setPricingConfigs(configsResult.data);
      }

      // Load fee collection summary
      const summaryResult = await getFeeCollectionSummary();
      if (summaryResult.success && summaryResult.data) {
        setFeeCollectionSummary(summaryResult.data);
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      setPricingError('Failed to load pricing configuration');
    } finally {
      setLoadingPricing(false);
    }
  };

  // Load Algorand configuration
  const loadAlgorandConfig = async () => {
    try {
      const config = getAdminConfig();
      setAlgorandConfig(config);
      setAlgorandFeeForm({
        mainnetFee: config.fees.algorandMainnetFee.toString(),
        testnetFee: config.fees.algorandTestnetFee.toString()
      });
    } catch (error) {
      console.error('Error loading Algorand config:', error);
    }
  };

  // Save Algorand fee configuration
  const saveAlgorandFees = async () => {
    setSavingAlgorandFees(true);
    try {
      const newConfig: Partial<AdminConfig> = {
        fees: {
          algorandMainnetFee: parseFloat(algorandFeeForm.mainnetFee),
          algorandTestnetFee: parseFloat(algorandFeeForm.testnetFee),
          solanaMainnetFee: algorandConfig?.fees.solanaMainnetFee || 0,
          solanaDevnetFee: algorandConfig?.fees.solanaDevnetFee || 0,
        }
      };

      const result = await updateAdminConfig(newConfig);
      
      if (result.success) {
        await loadAlgorandConfig();
        setEditingAlgorandFees(false);
        toast({
          title: "✅ Fees Updated",
          description: "Algorand fees have been updated successfully",
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Failed to update fees');
      }
    } catch (error) {
      toast({
        title: "❌ Update Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setSavingAlgorandFees(false);
    }
  };

  const handleEditPricing = (config: PricingConfig) => {
    setEditingConfig(config.network);
    setEditFormData({
      base_fee_amount: config.base_fee_amount,
      fee_destination_wallet: config.fee_destination_wallet,
      fee_destination_name: config.fee_destination_name,
      pricing_enabled: config.pricing_enabled,
      minimum_balance_required: config.minimum_balance_required,
      notes: config.notes
    });
  };

  const handleSavePricing = async (network: string) => {
    if (!publicKey) return;

    setSavingPricing(true);
    setPricingError('');

    try {
      // Validate wallet address if provided
      if (editFormData.fee_destination_wallet && 
          !validateWalletAddress(editFormData.fee_destination_wallet, network)) {
        throw new Error('Invalid wallet address format');
      }

      // Convert ALGO to microAlgos if needed
      const feeAmount = editFormData.base_fee_amount || 0;
      const feeInMicroAlgos = network.includes('algorand') ? 
        (feeAmount > 1000000 ? feeAmount : feeAmount * 1000000) : feeAmount;

      const updateData = {
        ...editFormData,
        base_fee_amount: feeInMicroAlgos
      };

      const result = await updatePricingConfig(
        network,
        updateData,
        publicKey.toString()
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update pricing configuration');
      }

      // Update local state
      setPricingConfigs(prev => 
        prev.map(config => 
          config.network === network 
            ? { ...config, ...result.data } 
            : config
        )
      );

      setEditingConfig(null);
      setEditFormData({});

      toast({
        title: "✅ Pricing Updated",
        description: `Successfully updated pricing for ${network}`,
        duration: 5000,
      });

      // Reload data to get updated history
      await loadPricingData();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPricingError(errorMessage);
      toast({
        title: "❌ Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setSavingPricing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setEditFormData({});
    setPricingError('');
  };

  const loadPricingHistory = async (network: string) => {
    try {
      const result = await getPricingHistory(network);
      if (result.success && result.data) {
        setPricingHistory(result.data);
      }
    } catch (error) {
      console.error('Error loading pricing history:', error);
    }
  };

  // [Previous Solana platform management functions remain the same]
  const checkPlatformState = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsCheckingState(true);
    setError('');
    try {
      const { verifyProgramDeployment } = await import('@/lib/solana');
      const programCheck = await verifyProgramDeployment();
      
      if (!programCheck.deployed) {
        setError(`❌ Smart Contract Issue: ${programCheck.error}`);
        toast({
          title: "⚠️ Smart Contract Not Deployed", 
          description: "The Solana program is not properly deployed to devnet. Please deploy the contract first.",
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      const result = await getPlatformState();
      
      if (result.success) {
        setStateInfo(result.data);
        setError('');
        alert("Platform is properly initialized and ready for token creation.");
      } else {
        setStateInfo(null);
        setError(result.error || 'Platform not yet initialized');
        toast({
          title: "⚠️ Platform Not Initialized", 
          description: "The platform needs to be initialized before tokens can be created. Use the form below to initialize it.",
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (err) {
      setStateInfo(null);
      setError('Platform not yet initialized - this is normal for a new deployment');
    } finally {
      setIsCheckingState(false);
    }
  };

  const handleInitialize = async () => {
    if (!connected || !publicKey || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    const feeInLamports = parseFloat(creationFee) * 1000000000;
    if (feeInLamports < 0 || feeInLamports > 1000000000000) {
      setError('Creation fee must be between 0 and 1000 SOL');
      return;
    }

    if (publicKey && publicKey.toString() !== ADMIN_WALLET.toString()) {
      setError(`❌ Admin access required. Only the designated admin wallet can initialize the platform.`);
      alert("Platform initialization requires the admin wallet. Please connect the correct wallet.");
      return;
    }

    console.log(`🚀 Initializing platform with fee: ${creationFee} SOL (${feeInLamports} lamports)`);
        
    setIsInitializing(true);
    setError('');
    setInitResult(null);

    try {
      const walletInterface = {
        publicKey: publicKey!,
        signTransaction: signTransaction!,
        signAllTransactions: signAllTransactions!
      };
      
      const result = await initializePlatform(walletInterface, feeInLamports);
      
      if (result.success) {
        setInitResult(result);
        setError('');
        console.log('✅ Platform initialization successful:', result);
          
        setTimeout(() => {
          alert(`🎉 Platform initialized successfully!\n\nCreation fee: ${creationFee} SOL\nState address: ${result.stateAddress}\nTransaction: ${result.signature}`);
          checkPlatformState();
        }, 2000);
      } else {
        const errorMsg = result.error || 'Failed to initialize platform';
        setError(errorMsg);
        
        let userMessage = errorMsg;
        if (errorMsg.includes('insufficient')) {
          userMessage = "❌ Insufficient SOL balance. Please add SOL to your wallet and try again.";
        } else if (errorMsg.includes('already initialized')) {
          userMessage = "ℹ️ Platform is already initialized. No action needed.";
        } else if (errorMsg.includes('access violation')) {
          userMessage = "❌ Smart contract error. Please contact support or try again later.";
        }
          
        setTimeout(() => {
          alert(userMessage);
        }, 500);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize platform';
      setError(errorMsg);
      alert(errorMsg.includes('insufficient') 
        ? "Insufficient SOL balance. Please add SOL to your wallet and try again."
        : `Unexpected error: ${errorMsg}. Please try again or contact support.`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="snarbles-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="snarbles-body">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin wallet
  if (connected && publicKey && publicKey.toString() !== ADMIN_WALLET.toString()) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-red-500/15 to-red-600/15 rounded-full blur-3xl snarbles-animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-full blur-3xl snarbles-animate-pulse delay-1000" />
        </div>

        <div className="min-h-screen p-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center snarbles-button-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>

            <div className="snarbles-card-premium p-8 snarbles-glow-red text-center">
              <div className="w-20 h-20 rounded-full snarbles-gradient-red flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/40">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="snarbles-heading text-3xl mb-4">Admin Access Required</h1>
              <p className="snarbles-body mb-8 leading-relaxed">
                This admin panel requires the designated admin wallet to access platform management tools.
              </p>

              <div className="snarbles-glass-subtle p-6 rounded-xl mb-8 snarbles-border-glow">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="snarbles-subheading text-red-400 font-semibold">Unauthorized Wallet</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="snarbles-body">Connected:</span>
                      <code className="block mt-1 snarbles-glass-subtle p-2 rounded text-xs font-mono break-all">
                        {publicKey?.toString()}
                      </code>
                    </div>
                    <div>
                      <span className="snarbles-body">Required:</span>
                      <code className="block mt-1 snarbles-glass-subtle p-2 rounded text-xs font-mono break-all border border-green-500/30">
                        {ADMIN_WALLET.toString()}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto snarbles-button-ghost">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to Platform
                  </Button>
                </Link>
                <Link href="/create">
                  <Button className="w-full sm:w-auto snarbles-button-primary">
                    <Rocket className="w-4 h-4 mr-2" />
                    Create Token
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!connected) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/15 to-purple-600/15 rounded-full blur-3xl snarbles-animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl snarbles-animate-pulse delay-1000" />
        </div>

        <div className="min-h-screen p-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center snarbles-button-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>

            <div className="snarbles-card-premium p-8 snarbles-glow-blue text-center">
              <div className="w-20 h-20 rounded-full snarbles-gradient-blue flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/40">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h1 className="snarbles-heading text-3xl mb-4">Admin Panel Access</h1>
              <p className="snarbles-body mb-8 leading-relaxed">
                Connect the designated admin wallet to access platform management tools.
              </p>

              <div className="mb-8">
                <WalletMultiButton className="snarbles-button-primary !min-h-[48px] !px-6 !text-base" />
              </div>

              <div className="snarbles-glass-subtle p-6 rounded-xl mb-8 snarbles-border-glow">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <span className="snarbles-subheading text-orange-400 font-semibold">Admin Wallet Required</span>
                </div>
                <p className="snarbles-body mb-3">Only this specific wallet can access admin functions:</p>
                <code className="block snarbles-glass-subtle p-3 rounded text-xs font-mono break-all border border-orange-500/30">
                  {ADMIN_WALLET.toString()}
                </code>
              </div>

              <div className="space-y-4">
                <p className="text-sm snarbles-body">
                  Don't have admin access? The platform is still fully functional:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/create">
                    <Button className="w-full sm:w-auto snarbles-button-primary">
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Token
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto snarbles-button-ghost">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Admin panel content
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-red-500/15 to-red-600/15 rounded-full blur-3xl snarbles-animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-purple-500/12 to-purple-600/12 rounded-full blur-3xl snarbles-animate-pulse delay-700" />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl snarbles-animate-pulse delay-1000" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-green-500/8 to-green-600/8 rounded-full blur-3xl snarbles-animate-pulse delay-500" />
      </div>

      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-3 snarbles-glass-subtle px-6 py-3 snarbles-border-glow">
                <Crown className="w-5 h-5 text-red-400 snarbles-animate-pulse" />
                <span className="uppercase tracking-wider text-red-400 font-bold text-sm">Administrator Panel</span>
                <div className="w-2 h-2 bg-red-400 rounded-full snarbles-animate-pulse"></div>
              </div>
              
              <h1 className="snarbles-heading text-5xl md:text-6xl">
                Platform
                <span className="snarbles-gradient-text-red"> Control Center</span>
              </h1>
              
              <p className="text-xl snarbles-body max-w-2xl leading-relaxed">
                Enterprise-grade platform administration with dynamic pricing controls for Algorand and Solana networks.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/" className="snarbles-button-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Platform Home
              </Link>
            </div>
          </div>

          {/* Enhanced Wallet Status */}
          <div className="snarbles-card-premium p-8 snarbles-glow-green">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-green flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-xl">Admin Wallet Connected</h3>
                  <p className="snarbles-body text-sm">Full administrative access granted</p>
                </div>
              </div>
            </div>
            
            <div className="snarbles-glass-subtle p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="snarbles-body text-sm font-medium">Connected Wallet Address:</span>
              </div>
              <code className="block snarbles-glass-subtle p-4 rounded-lg text-sm font-mono break-all snarbles-border-glow">
                {publicKey?.toString() || 'Wallet temporarily disabled'}
              </code>
            </div>
          </div>

          {/* Platform-wide Analytics */}
          <div className="snarbles-card-premium p-8 snarbles-glow-blue">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-2xl">Platform Analytics</h3>
                  <div className="flex items-center gap-2">
                    <p className="snarbles-body">Real-time insights and performance metrics</p>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-400 font-medium">Live Data</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => {
                    setSelectedTimeframe(e.target.value as '24h' | '7d' | '30d' | '90d');
                    loadPlatformAnalytics();
                  }}
                  className="snarbles-glass-subtle px-3 py-2 rounded-lg snarbles-border-glow text-sm"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <Button
                  onClick={loadPlatformAnalytics}
                  disabled={loadingAnalytics}
                  variant="outline"
                  size="sm"
                  className="snarbles-button-ghost"
                >
                  {loadingAnalytics ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 snarbles-body">Loading real analytics data...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Data Source Indicator */}
                <div className="snarbles-glass-subtle p-4 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="snarbles-body text-sm font-medium">Data Source:</span>
                    </div>
                    <span className="text-sm text-green-400">
                      {platformStats.totalTokens > 0 || platformStats.totalTransactions > 0 ? 
                        'Real Platform Data' : 
                        'No Data Yet - Create tokens to see metrics'
                      }
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow text-center">
                    <div className="w-12 h-12 rounded-full snarbles-gradient-green flex items-center justify-center mx-auto mb-3">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <p className="snarbles-body text-sm mb-1">Total Tokens</p>
                    <p className="snarbles-heading-4 snarbles-gradient-text-green">{platformStats.totalTokens.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Successfully created</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow text-center">
                    <div className="w-12 h-12 rounded-full snarbles-gradient-blue flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <p className="snarbles-body text-sm mb-1">Transactions</p>
                    <p className="snarbles-heading-4 snarbles-gradient-text-blue">{platformStats.totalTransactions.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Platform activities</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow text-center">
                    <div className="w-12 h-12 rounded-full snarbles-gradient-purple flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <p className="snarbles-body text-sm mb-1">Total Revenue</p>
                    <p className="snarbles-heading-4 snarbles-gradient-text-purple">${platformStats.totalRevenue}</p>
                    <p className="text-xs text-gray-400 mt-1">Fee collections</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow text-center">
                    <div className="w-12 h-12 rounded-full snarbles-gradient-orange flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="snarbles-body text-sm mb-1">Active Users</p>
                    <p className="snarbles-heading-4 snarbles-gradient-text-orange">{platformStats.activeUsers.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Unique wallets</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="snarbles-glass-subtle p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="snarbles-body text-sm">Success Rate</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="snarbles-subheading text-lg text-green-400">{platformStats.successRate}%</p>
                    <p className="text-xs text-gray-400 mt-1">Token creation success</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="snarbles-body text-sm">Avg Creation Time</span>
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="snarbles-subheading text-lg text-blue-400">{platformStats.avgTokenCreationTime}</p>
                    <p className="text-xs text-gray-400 mt-1">Cross-network average</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="snarbles-body text-sm">Networks</span>
                      <Globe className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="snarbles-subheading text-lg text-purple-400">{platformStats.networksSupported}</p>
                    <p className="text-xs text-gray-400 mt-1">Algorand & Solana</p>
                  </div>
                  
                  <div className="snarbles-glass-subtle p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="snarbles-body text-sm">Verifications</span>
                      <Shield className="w-4 h-4 text-orange-400" />
                    </div>
                    <p className="snarbles-subheading text-lg text-orange-400">{platformStats.totalVerifications.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Security checks</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-gray-400" />
                    <h4 className="snarbles-subheading text-lg">Recent Activity</h4>
                    <span className="text-xs text-gray-400">({selectedTimeframe})</span>
                  </div>
                  
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'token_creation' ? 'bg-green-500/20 text-green-400' :
                              activity.type === 'token_verification' ? 'bg-blue-500/20 text-blue-400' :
                              activity.type === 'fee_collection' ? 'bg-purple-500/20 text-purple-400' :
                              activity.type === 'wallet_connection' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {activity.type === 'token_creation' ? <Coins className="w-4 h-4" /> :
                               activity.type === 'token_verification' ? <Shield className="w-4 h-4" /> :
                               activity.type === 'fee_collection' ? <DollarSign className="w-4 h-4" /> :
                               activity.type === 'wallet_connection' ? <Wallet className="w-4 h-4" /> :
                               <Activity className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="snarbles-body text-sm font-medium">
                                {activity.type === 'token_creation' ? `Token created by ${activity.user}` :
                                 activity.type === 'token_verification' ? `Token verified: ${activity.tokenId || 'Unknown'}` :
                                 activity.type === 'fee_collection' ? `Fee collected: ${activity.amount}` :
                                 activity.type === 'wallet_connection' ? `Wallet connected: ${activity.user}` :
                                 'Platform activity'}
                              </p>
                              <p className="text-xs text-gray-400">{activity.network} • {new Date(activity.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.network === 'solana' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {activity.network}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                        <History className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="snarbles-body text-gray-400 mb-2">No recent activity</p>
                      <p className="text-sm text-gray-500">Activity will appear here as users interact with the platform</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          <div className="snarbles-card-premium p-8 snarbles-glow-red">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-red flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-2xl">Platform Controls</h3>
                  <p className="snarbles-body">System-wide settings and feature toggles</p>
                </div>
              </div>
              <Button
                onClick={savePlatformSettings}
                disabled={savingSettings}
                className="snarbles-button-primary"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-8">
              {/* System Controls */}
              <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                <h4 className="snarbles-subheading text-lg mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  System Controls
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-400">Temporarily disable platform access</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        maintenanceMode: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Emergency Stop</p>
                      <p className="text-sm text-gray-400">Immediately halt all operations</p>
                    </div>
                    <Switch
                      checked={platformSettings.emergencyStop}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        emergencyStop: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Token Creation</p>
                      <p className="text-sm text-gray-400">Allow users to create new tokens</p>
                    </div>
                    <Switch
                      checked={platformSettings.tokenCreationEnabled}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        tokenCreationEnabled: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Token Verification</p>
                      <p className="text-sm text-gray-400">Enable token verification service</p>
                    </div>
                    <Switch
                      checked={platformSettings.verificationEnabled}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        verificationEnabled: checked
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                <h4 className="snarbles-subheading text-lg mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Feature Flags
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Algorand Support</p>
                      <p className="text-sm text-gray-400">Enable Algorand blockchain features</p>
                    </div>
                    <Switch
                      checked={platformSettings.featureFlags.algorandSupport}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        featureFlags: { ...prev.featureFlags, algorandSupport: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Solana Support</p>
                      <p className="text-sm text-gray-400">Enable Solana blockchain features</p>
                    </div>
                    <Switch
                      checked={platformSettings.featureFlags.solanaSupport}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        featureFlags: { ...prev.featureFlags, solanaSupport: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Advanced Features</p>
                      <p className="text-sm text-gray-400">Enable premium platform features</p>
                    </div>
                    <Switch
                      checked={platformSettings.featureFlags.advancedFeatures}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        featureFlags: { ...prev.featureFlags, advancedFeatures: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">Beta Features</p>
                      <p className="text-sm text-gray-400">Enable experimental features</p>
                    </div>
                    <Switch
                      checked={platformSettings.featureFlags.betaFeatures}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        featureFlags: { ...prev.featureFlags, betaFeatures: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* User Management */}
              <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                <h4 className="snarbles-subheading text-lg mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  User Management
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div>
                      <p className="snarbles-body font-medium">New User Registration</p>
                      <p className="text-sm text-gray-400">Allow new users to register</p>
                    </div>
                    <Switch
                      checked={platformSettings.newUserRegistration}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({
                        ...prev,
                        newUserRegistration: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex-1 mr-4">
                      <p className="snarbles-body font-medium">Max Tokens Per User</p>
                      <p className="text-sm text-gray-400">Maximum number of tokens a user can create</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={platformSettings.maxTokensPerUser}
                      onChange={(e) => setPlatformSettings(prev => ({
                        ...prev,
                        maxTokensPerUser: parseInt(e.target.value) || 100
                      }))}
                      className="w-24 snarbles-glass-subtle snarbles-border-glow text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Algorand Fee Configuration Section */}
          <div className="snarbles-card-premium p-8 snarbles-glow-blue">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-2xl">Algorand Fee Configuration</h3>
                  <p className="snarbles-body">Configure token creation fees for Algorand networks</p>
                </div>
              </div>
              <Button
                onClick={() => setEditingAlgorandFees(!editingAlgorandFees)}
                variant="outline"
                className="snarbles-button-ghost"
              >
                {editingAlgorandFees ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Fees
                  </>
                )}
              </Button>
            </div>

            {algorandConfig && (
              <div className="space-y-6">
                {/* Current Configuration Display */}
                {!editingAlgorandFees && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full snarbles-gradient-green flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="snarbles-subheading text-lg">Algorand Mainnet</h4>
                          <p className="snarbles-body text-sm text-gray-400">Production network</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="snarbles-body text-sm">Creation Fee:</span>
                          <span className="snarbles-heading text-lg font-bold text-green-400">
                            {algorandConfig.fees.algorandMainnetFee} ALGO
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="snarbles-body text-sm">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            algorandConfig.fees.algorandMainnetFee > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {algorandConfig.fees.algorandMainnetFee > 0 ? 'Enabled' : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full snarbles-gradient-blue flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="snarbles-subheading text-lg">Algorand Testnet</h4>
                          <p className="snarbles-body text-sm text-gray-400">Development network</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="snarbles-body text-sm">Creation Fee:</span>
                          <span className="snarbles-heading text-lg font-bold text-blue-400">
                            {algorandConfig.fees.algorandTestnetFee} ALGO
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="snarbles-body text-sm">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            algorandConfig.fees.algorandTestnetFee > 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {algorandConfig.fees.algorandTestnetFee > 0 ? 'Enabled' : 'Free'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fee Editing Form */}
                {editingAlgorandFees && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="mainnetFee" className="snarbles-subheading">
                          Algorand Mainnet Fee (ALGO)
                        </Label>
                        <Input
                          id="mainnetFee"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="10"
                          value={algorandFeeForm.mainnetFee}
                          onChange={(e) => setAlgorandFeeForm(prev => ({
                            ...prev,
                            mainnetFee: e.target.value
                          }))}
                          className="snarbles-glass-subtle h-12 text-base snarbles-border-glow"
                        />
                        <p className="text-sm snarbles-body text-gray-400">
                          Fee charged for creating tokens on Algorand mainnet
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="testnetFee" className="snarbles-subheading">
                          Algorand Testnet Fee (ALGO)
                        </Label>
                        <Input
                          id="testnetFee"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={algorandFeeForm.testnetFee}
                          onChange={(e) => setAlgorandFeeForm(prev => ({
                            ...prev,
                            testnetFee: e.target.value
                          }))}
                          className="snarbles-glass-subtle h-12 text-base snarbles-border-glow"
                        />
                        <p className="text-sm snarbles-body text-gray-400">
                          Fee charged for creating tokens on Algorand testnet (usually 0)
                        </p>
                      </div>
                    </div>

                    <div className="snarbles-glass-subtle p-4 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        <span className="snarbles-subheading text-blue-400 text-sm">Fee Recipient</span>
                      </div>
                      <p className="snarbles-body text-sm mb-2">Fees will be sent to your admin wallet:</p>
                      <code className="block snarbles-glass-subtle p-2 rounded text-xs font-mono break-all">
                        {algorandConfig.adminWallet}
                      </code>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={saveAlgorandFees}
                        disabled={savingAlgorandFees}
                        className="snarbles-button-primary"
                      >
                        {savingAlgorandFees ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Fees
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingAlgorandFees(false);
                          setAlgorandFeeForm({
                            mainnetFee: algorandConfig.fees.algorandMainnetFee.toString(),
                            testnetFee: algorandConfig.fees.algorandTestnetFee.toString()
                          });
                        }}
                        variant="outline"
                        className="snarbles-button-ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Pricing Management Section */}
          <div className="snarbles-card-premium p-8 snarbles-glow-orange">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl snarbles-gradient-orange flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="snarbles-subheading text-2xl">Dynamic Pricing Configuration</h3>
                <p className="snarbles-body">Configure network-specific pricing and fee destinations</p>
              </div>
            </div>

            {loadingPricing ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 snarbles-body">Loading pricing configurations...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {pricingConfigs.map((config) => (
                  <div key={config.network} className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="snarbles-subheading text-lg">{config.network_display_name}</h4>
                          <p className="snarbles-body text-sm text-gray-400">{config.network}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={config.pricing_enabled}
                          disabled={editingConfig === config.network}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPricing(config)}
                          disabled={editingConfig !== null}
                          className="snarbles-button-ghost"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    {editingConfig === config.network ? (
                      // Edit form
                      <div className="space-y-4 border-t border-gray-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="snarbles-subheading">Fee Amount ({config.base_fee_currency})</Label>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="10.000"
                              value={editFormData.base_fee_amount ? 
                                (config.network.includes('algorand') ? 
                                  (editFormData.base_fee_amount / 1000000).toString() : 
                                  editFormData.base_fee_amount.toString()) : ''}
                              onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                base_fee_amount: parseFloat(e.target.value) || 0
                              }))}
                              className="snarbles-glass-subtle snarbles-border-glow"
                            />
                            <p className="text-xs snarbles-body mt-1">
                              Current: {formatFeeAmount(config.base_fee_amount, config.base_fee_currency)}
                            </p>
                          </div>
                          <div>
                            <Label className="snarbles-subheading">Destination Name</Label>
                            <Input
                              placeholder="Fee Collection Wallet"
                              value={editFormData.fee_destination_name || ''}
                              onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                fee_destination_name: e.target.value
                              }))}
                              className="snarbles-glass-subtle snarbles-border-glow"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="snarbles-subheading">Destination Wallet Address</Label>
                          <Input
                            placeholder="Wallet address to receive fees"
                            value={editFormData.fee_destination_wallet || ''}
                            onChange={(e) => setEditFormData(prev => ({
                              ...prev,
                              fee_destination_wallet: e.target.value
                            }))}
                            className="snarbles-glass-subtle snarbles-border-glow font-mono text-sm"
                          />
                          <p className="text-xs snarbles-body mt-1">
                            Must be a valid {config.network.includes('algorand') ? 'Algorand' : 'Solana'} wallet address
                          </p>
                        </div>

                        <div>
                          <Label className="snarbles-subheading">Notes</Label>
                          <Textarea
                            placeholder="Admin notes about this pricing configuration..."
                            value={editFormData.notes || ''}
                            onChange={(e) => setEditFormData(prev => ({
                              ...prev,
                              notes: e.target.value
                            }))}
                            className="snarbles-glass-subtle snarbles-border-glow"
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editFormData.pricing_enabled ?? config.pricing_enabled}
                            onCheckedChange={(checked) => setEditFormData(prev => ({
                              ...prev,
                              pricing_enabled: checked
                            }))}
                          />
                          <Label className="snarbles-body">Enable pricing for this network</Label>
                        </div>

                        {pricingError && (
                          <Alert className="border-red-500/30 bg-red-500/10">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription className="text-red-400">
                              {pricingError}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => handleSavePricing(config.network)}
                            disabled={savingPricing}
                            className="snarbles-button-primary"
                          >
                            {savingPricing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={savingPricing}
                            className="snarbles-button-ghost"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display current configuration
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="snarbles-glass-subtle p-4 rounded-lg">
                          <p className="snarbles-body text-sm mb-1">Current Fee</p>
                          <p className="snarbles-subheading text-lg">
                            {config.pricing_enabled ? 
                              formatFeeAmount(config.base_fee_amount, config.base_fee_currency) : 
                              'Free'
                            }
                          </p>
                        </div>
                        <div className="snarbles-glass-subtle p-4 rounded-lg">
                          <p className="snarbles-body text-sm mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.pricing_enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <p className="snarbles-subheading text-sm">
                              {config.pricing_enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>
                        <div className="snarbles-glass-subtle p-4 rounded-lg">
                          <p className="snarbles-body text-sm mb-1">Destination</p>
                          <p className="snarbles-subheading text-sm">
                            {config.fee_destination_name || 'Not configured'}
                          </p>
                        </div>
                        <div className="snarbles-glass-subtle p-4 rounded-lg">
                          <p className="snarbles-body text-sm mb-1">Last Updated</p>
                          <p className="snarbles-subheading text-sm">
                            {config.updated_at ? new Date(config.updated_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fee Collection Analytics */}
          {feeCollectionSummary.length > 0 && (
            <div className="snarbles-card-premium p-8 snarbles-glow-purple">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-purple flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-2xl">Fee Collection Analytics</h3>
                  <p className="snarbles-body">Real-time revenue and transaction metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feeCollectionSummary.map((summary) => (
                  <div key={`${summary.network}-${summary.fee_currency}`} 
                       className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="snarbles-subheading text-lg">{summary.network}</h4>
                      <Coins className="w-5 h-5 text-purple-400" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="snarbles-body text-sm">Total Collected</span>
                        <span className="snarbles-subheading">
                          {formatFeeAmount(summary.confirmed_fees, summary.fee_currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="snarbles-body text-sm">Confirmed Txns</span>
                        <span className="snarbles-gradient-text-green font-semibold">
                          {summary.confirmed_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="snarbles-body text-sm">Pending Txns</span>
                        <span className="snarbles-gradient-text-yellow font-semibold">
                          {summary.pending_count}
                        </span>
                      </div>
                      {summary.failed_count > 0 && (
                        <div className="flex justify-between">
                          <span className="snarbles-body text-sm">Failed Txns</span>
                          <span className="snarbles-gradient-text-red font-semibold">
                            {summary.failed_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Management Grid (existing Solana platform controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Platform State Check */}
            <div className="snarbles-card-premium p-8 snarbles-glow-blue">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-xl">Solana Platform Status</h3>
                  <p className="snarbles-body text-sm">Check Solana initialization and configuration</p>
                </div>
              </div>

              <Button 
                onClick={checkPlatformState}
                disabled={isCheckingState}
                className="w-full snarbles-button-primary mb-6"
              >
                {isCheckingState ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 mr-2" />
                    Check Solana Platform State
                  </>
                )}
              </Button>

              {stateInfo && (
                <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-glow-green">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="snarbles-subheading text-green-400 font-semibold">Solana Platform Initialized</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="snarbles-body">Admin:</span>
                      <code className="text-xs font-mono">{stateInfo.admin.toString().slice(0, 8)}...</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="snarbles-body">Creation Fee:</span>
                      <span className="snarbles-gradient-text-green font-semibold">{stateInfo.creationFee.toString()} lamports</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="snarbles-body">Total Tokens:</span>
                      <span className="snarbles-gradient-text-green font-semibold">{stateInfo.totalTokens.toString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && !stateInfo && (
                <div className="snarbles-glass-subtle p-6 rounded-xl border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="snarbles-subheading text-yellow-400 font-semibold">Solana Platform Status</span>
                  </div>
                  <p className="snarbles-body text-sm mb-4">{error}</p>
                  {error.includes('not yet initialized') && (
                    <div className="text-sm snarbles-body">
                      <p className="font-semibold mb-2">Next steps:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Set your desired creation fee</li>
                        <li>Click "Initialize Platform"</li>
                        <li>Enable token creation for users</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Platform Initialization */}
            <div className="snarbles-card-premium p-8 snarbles-glow-cyan">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-cyan flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-subheading text-xl">Initialize Solana Platform</h3>
                  <p className="snarbles-body text-sm">Configure Solana platform settings and fees</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="creationFee" className="snarbles-subheading">Solana Creation Fee (SOL)</Label>
                  <Input
                    className="snarbles-glass-subtle h-12 text-base snarbles-border-glow"
                    id="creationFee"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={creationFee}
                    onChange={(e) => setCreationFee(e.target.value)}
                    disabled={isInitializing}
                  />
                  <p className="text-sm snarbles-body">
                    Fee charged for creating new tokens on Solana (0 for free creation)
                  </p>
                </div>

                <Button 
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="w-full snarbles-button-primary"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing Platform...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Initialize Solana Platform
                    </>
                  )}
                </Button>

                {error && (
                  <div className="snarbles-glass-subtle p-4 rounded-xl border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="snarbles-subheading text-red-400 text-sm">Error</span>
                    </div>
                    <p className="snarbles-body text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}