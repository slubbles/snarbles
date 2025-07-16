'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cell, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import { 
  Calculator, 
  Download, 
  PieChart as PieChartIcon,
  Clock, 
  Lock, 
  ChevronRight, 
  Check, 
  X, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Settings,
  Copy,
  Rocket,
  Sparkles,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';

// Define distribution categories with default values
const defaultDistribution = {
  team: { label: 'Team', value: 15, color: '#FF6B6B' },
  investors: { label: 'Investors', value: 20, color: '#4ECDC4' },
  community: { label: 'Community', value: 30, color: '#FFD166' },
  liquidity: { label: 'Liquidity', value: 15, color: '#6A0572' },
  marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
  reserve: { label: 'Reserve', value: 10, color: '#3A86FF' }
};

// Define vesting schedules
const defaultVesting = {
  enabled: true,
  team: { period: 24, initialRelease: 10 },
  investors: { period: 12, initialRelease: 20 },
  advisors: { period: 18, initialRelease: 15 }
};

// Define template data
const templates = {
  defi: {
    name: 'DeFi Protocol',
    totalSupply: 100000000,
    distribution: {
      team: { label: 'Team', value: 15, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 15, color: '#4ECDC4' },
      community: { label: 'Community', value: 40, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 20, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
      reserve: { label: 'Treasury', value: 0, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 24, initialRelease: 10 },
      investors: { period: 12, initialRelease: 20 },
      advisors: { period: 18, initialRelease: 15 }
    },
    supplyType: 'fixed'
  },
  dao: {
    name: 'DAO Governance',
    totalSupply: 50000000,
    distribution: {
      team: { label: 'Team', value: 10, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 15, color: '#4ECDC4' },
      community: { label: 'Community', value: 60, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 5, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 5, color: '#1A535C' },
      reserve: { label: 'Treasury', value: 5, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 36, initialRelease: 0 },
      investors: { period: 24, initialRelease: 10 },
      advisors: { period: 12, initialRelease: 20 }
    },
    supplyType: 'inflationary'
  },
  gamefi: {
    name: 'GameFi Project',
    totalSupply: 200000000,
    distribution: {
      team: { label: 'Team', value: 18, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 22, color: '#4ECDC4' },
      community: { label: 'Players & Rewards', value: 35, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 0, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 25, color: '#1A535C' },
      reserve: { label: 'Reserve', value: 0, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 30, initialRelease: 5 },
      investors: { period: 18, initialRelease: 15 },
      advisors: { period: 12, initialRelease: 20 }
    },
    supplyType: 'deflationary'
  }
};

export default function TokenomicsPage() {
  // State for token supply and distribution
  const [totalSupply, setTotalSupply] = useState(100000000);
  const [distribution, setDistribution] = useState(defaultDistribution);
  const [vestingSchedule, setVestingSchedule] = useState(defaultVesting);
  const [activeTab, setActiveTab] = useState('distribution');
  const [supplyType, setSupplyType] = useState('fixed');
  const [vestingEnabled, setVestingEnabled] = useState(true);
  const [healthScore, setHealthScore] = useState(78);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Debounce function
  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout | undefined;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  // Check if we're applying tokenomics from saved config
  useEffect(() => {
    const applyParam = searchParams?.get('apply');
    if (applyParam === 'true') {
      // Try to load saved tokenomics from localStorage
      try {
        const saved = localStorage.getItem('snarbles_tokenomics');
        if (saved) {
          const data = JSON.parse(saved);
          
          if (data.totalSupply) setTotalSupply(data.totalSupply);
          if (data.distribution) setDistribution(data.distribution);
          if (data.vestingSchedule) setVestingSchedule(data.vestingSchedule);
          if (data.supplyType) setSupplyType(data.supplyType);
          if (data.healthScore) setHealthScore(data.healthScore);
          
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      } catch (err) {
        console.error('Failed to load tokenomics data:', err);
      }
    }
  }, [searchParams]);
  
  // Calculate health score whenever distribution changes
  useEffect(() => {
    const teamPercent = distribution.team.value;
    const investorsPercent = distribution.investors.value;
    const communityPercent = distribution.community.value;
    
    // A basic algorithm to calculate health score
    // - Community allocation should be high (higher is better)
    // - Team allocation should be reasonable (too high or too low is bad)
    // - Investor allocation should not be too high
    
    const communityScore = Math.min(communityPercent * 2, 100); // Up to 50% of total
    const teamScore = 100 - Math.abs(teamPercent - 15) * 3; // Ideal around 15%
    const investorScore = 100 - Math.max(0, investorsPercent - 25) * 2; // Penalize if over 25%
    
    // Vesting increases score
    const vestingBonus = vestingEnabled ? 10 : 0;
    
    // Total score
    const calculatedScore = Math.round((communityScore * 0.4 + teamScore * 0.3 + investorScore * 0.3) + vestingBonus);
    // Clamp between 0-100
    const finalScore = Math.max(0, Math.min(100, calculatedScore));
    
    setHealthScore(finalScore);
  }, [distribution, vestingEnabled]);
  
  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Debounced set total supply
  const debouncedSetTotalSupply = useCallback(
    debounce((value) => {
      setTotalSupply(value);
    }, 300),
    []
  );
  
  // Handle total supply change with validation
  const handleTotalSupplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    
    if (value === '' || isNaN(parsedValue)) {
      e.target.value = '';
      debouncedSetTotalSupply(0);
      return;
    }
    
    if (parsedValue < 0) {
      e.target.value = '0';
      debouncedSetTotalSupply(0);
      return;
    }
    
    debouncedSetTotalSupply(parsedValue);
  };
  
  // Update distribution and ensure total is 100%
  const handleDistributionChange = (category: string, newValue: number) => {
    // Calculate how much we need to adjust other categories
    const currentTotal = Object.values(distribution)
      .reduce((sum, item) => sum + item.value, 0);
    
    const currentCategoryValue = distribution[category as keyof typeof distribution].value;
    const difference = newValue - currentCategoryValue;
    const newTotal = currentTotal + difference;
    
    // If new total would exceed 100%, adjust other categories proportionally
    if (newTotal > 100) {
      // How much we need to reduce other categories
      const excess = newTotal - 100;
      const otherCategories = Object.keys(distribution).filter(key => key !== category);
      
      // Calculate total value of other categories
      const otherTotal = otherCategories.reduce(
        (sum, key) => sum + distribution[key as keyof typeof distribution].value, 0
      );
      
      // Create new distribution
      const newDistribution = { ...distribution };
      newDistribution[category as keyof typeof distribution] = { ...distribution[category as keyof typeof distribution], value: newValue };
      
      // Adjust other categories proportionally
      otherCategories.forEach(key => {
        const proportion = distribution[key as keyof typeof distribution].value / otherTotal;
        const reduction = excess * proportion;
        newDistribution[key as keyof typeof distribution] = {
          ...distribution[key as keyof typeof distribution],
          value: Math.max(0, distribution[key as keyof typeof distribution].value - reduction)
        };
      });
      
      setDistribution(newDistribution);
    } else {
      // Simple case - just update the category and we're still <= 100%
      setDistribution({
        ...distribution,
        [category]: { ...distribution[category as keyof typeof distribution], value: newValue }
      });
    }
  };
  
  // Generate distribution data for charts
  const getDistributionData = () => {
    return Object.keys(distribution).map(key => ({
      name: distribution[key as keyof typeof distribution].label,
      value: distribution[key as keyof typeof distribution].value,
      color: distribution[key as keyof typeof distribution].color,
      amount: Math.round(totalSupply * (distribution[key as keyof typeof distribution].value / 100))
    }));
  };
  
  // Save tokenomics for use in token creation
  const saveTokenomics = () => {
    const tokenomicsData = {
      name: 'Custom',
      totalSupply,
      distribution,
      vestingSchedule,
      supplyType,
      healthScore,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('snarbles_tokenomics', JSON.stringify(tokenomicsData));
    
    toast({
      title: "Tokenomics Saved",
      description: "Your tokenomics configuration has been saved"
    });
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };
  
  // Apply tokenomics to token creation
  const applyToToken = () => {
    saveTokenomics();
    
    toast({
      title: "Applying Tokenomics",
      description: "Redirecting to token creation with your tokenomics"
    });
    
    router.push('/create?tokenomics=applied');
  };
  
  // Custom tooltip for distribution chart
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 text-sm snarbles-border-glow">
          <p className="font-bold snarbles-gradient-text-red">{payload[0].name}</p>
          <p className="text-muted-foreground">{payload[0].value}% of supply</p>
          <p className="text-muted-foreground">{formatNumber(payload[0].payload.amount)} tokens</p>
        </div>
      );
    }
    return null;
  };
  
  // Export tokenomics as PDF
  const exportTokenomics = async () => {
    toast({
      title: "Export Started",
      description: "Preparing your tokenomics document..."
    });
    
    try {
      const doc = new jsPDF();
      const distributionData = getDistributionData();
      
      // Title
      doc.setFontSize(22);
      doc.text("Tokenomics Report", 105, 20, { align: "center" });
      
      // Project info
      doc.setFontSize(16);
      doc.text("Token Supply & Distribution", 20, 40);
      
      // Token details
      doc.setFontSize(12);
      doc.text(`Total Supply: ${formatNumber(totalSupply)} tokens`, 20, 55);
      doc.text(`Supply Type: ${supplyType.charAt(0).toUpperCase() + supplyType.slice(1)}`, 20, 65);
      doc.text(`Health Score: ${healthScore}/100`, 20, 75);
      doc.text(`Vesting Enabled: ${vestingEnabled ? 'Yes' : 'No'}`, 20, 85);
      
      // Distribution table
      doc.setFontSize(16);
      doc.text("Token Distribution", 20, 105);
      
      doc.setFontSize(12);
      doc.text("Category", 20, 115);
      doc.text("Percentage", 90, 115);
      doc.text("Token Amount", 150, 115);
      
      doc.setLineWidth(0.1);
      doc.line(20, 118, 190, 118);
      
      let yPosition = 128;
      distributionData.forEach((item) => {
        doc.text(item.name, 20, yPosition);
        doc.text(`${item.value}%`, 90, yPosition);
        doc.text(formatNumber(item.amount), 150, yPosition);
        yPosition += 10;
      });
      
      // Vesting details if enabled
      if (vestingEnabled) {
        doc.setFontSize(16);
        doc.text("Vesting Schedule", 20, yPosition + 20);
        
        doc.setFontSize(12);
        yPosition += 30;
        doc.text("Team vesting period: " + vestingSchedule.team.period + " months", 20, yPosition);
        yPosition += 10;
        doc.text("Investors vesting period: " + vestingSchedule.investors.period + " months", 20, yPosition);
      }
      
      // Health score analysis
      doc.setFontSize(16);
      yPosition += 30;
      doc.text("Health Score Analysis", 20, yPosition);
      
      doc.setFontSize(12);
      yPosition += 10;
      if (healthScore >= 80) {
        doc.text("Excellent: Your tokenomics design is well balanced and follows best practices.", 20, yPosition);
      } else if (healthScore >= 60) {
        doc.text("Good: Your tokenomics is solid with some room for improvement.", 20, yPosition);
      } else if (healthScore >= 40) {
        doc.text("Average: Consider adjusting your distribution for better balance.", 20, yPosition);
      } else {
        doc.text("Needs Improvement: Your current design may lead to centralization concerns.", 20, yPosition);
      }
      
      // Footer with date
      const date = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Generated on ${date} · Snarbles Tokenomics Simulator`, 105, 280, { align: "center" });
      
      // Save the PDF
      doc.save(`tokenomics_${supplyType}_${date.replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "Export Complete",
        description: "Your tokenomics document has been downloaded"
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF",
        variant: "destructive"
      });
    }
  };
  
  // Get health score indicator
  const getHealthIndicator = () => {
    if (healthScore >= 80) {
      return {
        icon: <Check className="w-5 h-5" />,
        label: 'Excellent',
        color: 'text-green-400 bg-green-500/10 border-green-500/30',
        glow: 'snarbles-glow-green'
      };
    } else if (healthScore >= 60) {
      return {
        icon: <Check className="w-5 h-5" />,
        label: 'Good',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        glow: 'snarbles-glow-blue'
      };
    } else if (healthScore >= 40) {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        label: 'Needs Improvement',
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
        glow: 'snarbles-glow-red'
      };
    } else {
      return {
        icon: <X className="w-5 h-5" />,
        label: 'Poor',
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        glow: 'snarbles-glow-red'
      };
    }
  };
  
  // Apply template
  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    if (!template) return;
    
    setTotalSupply(template.totalSupply);
    setDistribution(template.distribution);
    setVestingSchedule(template.vestingSchedule);
    setVestingEnabled(template.vestingSchedule.enabled);
    setSupplyType(template.supplyType);
    
    toast({
      title: `${template.name} Template Applied`,
      description: "Distribution and vesting schedule have been updated"
    });
  };
  
  const healthIndicator = getHealthIndicator();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Tokenomics Simulator...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/12 to-blue-600/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16 space-y-8">
          <div className="inline-flex items-center space-x-3 glass-card px-6 py-3">
            <Calculator className="w-5 h-5 text-primary animate-pulse" />
            <span className="uppercase tracking-wider text-primary font-bold text-sm">Professional Tokenomics</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            Design Optimal Token 
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Distribution</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Create professional tokenomics with our advanced visual designer, then apply directly to your token creation
          </p>
        </div>

        {/* Success banner */}
        {savedSuccess && (
          <div className="mb-8 glass-card-premium p-6 snarbles-glow-green snarbles-animate-fade-in">
            <div className="flex items-center space-x-4">
              <Check className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="snarbles-subheading text-lg snarbles-gradient-text-green">Configuration Saved!</h3>
                <p className="text-muted-foreground">Your tokenomics have been saved and can be applied to token creation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Enhanced Controls */}
          <div className="lg:col-span-5 space-y-8">
            {/* Supply Settings */}
            <Card className="glass-card-premium snarbles-border-glow snarbles-animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                  <span className="snarbles-subheading">Supply Configuration</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Define your token's total supply and economics model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalSupply" className="text-sm font-semibold text-foreground">Total Supply</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      defaultValue={totalSupply}
                      onChange={handleTotalSupplyChange}
                      min="0"
                      className="bg-background border-border text-foreground"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 100M-1B for utility tokens, 10-100M for governance
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Supply Type</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={supplyType === 'fixed' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('fixed')}
                        className={`flex-1 transition-all duration-300 ${
                          supplyType === 'fixed' 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        Fixed Supply
                      </Button>
                      <Button
                        variant={supplyType === 'inflationary' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('inflationary')}
                        className={`flex-1 transition-all duration-300 ${
                          supplyType === 'inflationary' 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        Inflationary
                      </Button>
                      <Button
                        variant={supplyType === 'deflationary' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('deflationary')}
                        className={`flex-1 transition-all duration-300 ${
                          supplyType === 'deflationary' 
                            ? 'bg-primary hover:bg-primary/90' 
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        Deflationary
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-foreground">Vesting Schedule</span>
                    </div>
                    <Switch 
                      checked={vestingEnabled}
                      onCheckedChange={setVestingEnabled}
                    />
                  </div>
                  
                  {vestingEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-500/20">
                      <div className="space-y-2">
                        <Label>Team Vesting Period (months)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[vestingSchedule.team.period]}
                            min={6}
                            max={48}
                            step={3}
                            onValueChange={(values) => setVestingSchedule({
                              ...vestingSchedule,
                              team: { ...vestingSchedule.team, period: values[0] }
                            })}
                            className="flex-1 glass-card snarbles-border-glow"
                          />
                          <span className="w-10 text-center font-mono glass-card snarbles-border-glow">
                            {vestingSchedule.team.period}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Investor Vesting Period (months)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[vestingSchedule.investors.period]}
                            min={3}
                            max={24}
                            step={3}
                            onValueChange={(values) => setVestingSchedule({
                              ...vestingSchedule,
                              investors: { ...vestingSchedule.investors, period: values[0] }
                            })}
                            className="flex-1 glass-card snarbles-border-glow"
                          />
                          <span className="w-10 text-center font-mono glass-card snarbles-border-glow">
                            {vestingSchedule.investors.period}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg glass-card snarbles-border-glow">
                        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-600 text-muted-foreground">
                          Vesting schedules increase investor confidence by demonstrating long-term commitment
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Distribution Settings */}
            <Card className="glass-card-premium snarbles-border-glow snarbles-animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-red-500" />
                  <span className="snarbles-subheading">Token Distribution</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Allocate your token supply across different stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sliders" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 glass-card snarbles-border-glow">
                    <TabsTrigger value="sliders" className="text-muted-foreground">Sliders</TabsTrigger>
                    <TabsTrigger value="manual" className="text-muted-foreground">Manual Entry</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sliders" className="space-y-6">
                    {Object.keys(distribution).map((key) => (
                      <div key={key} className="space-y-2 glass-card snarbles-border-glow">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center text-muted-foreground">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: distribution[key as keyof typeof distribution].color }}></div>
                            {distribution[key as keyof typeof distribution].label}
                          </Label>
                          <span className="text-sm font-mono text-muted-foreground">
                            {distribution[key as keyof typeof distribution].value}% ({formatNumber(Math.round(totalSupply * distribution[key as keyof typeof distribution].value / 100))})
                          </span>
                        </div>
                        <Slider
                          value={[distribution[key as keyof typeof distribution].value]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(values) => handleDistributionChange(key, values[0])}
                          className="flex-1 glass-card snarbles-border-glow"
                        />
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4 glass-card snarbles-border-glow">
                    {Object.keys(distribution).map((key) => (
                      <div key={key} className="grid grid-cols-4 gap-4 items-center glass-card snarbles-border-glow">
                        <div className="col-span-2 flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: distribution[key as keyof typeof distribution].color }}></div>
                          <Label className="text-muted-foreground">{distribution[key as keyof typeof distribution].label}</Label>
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={distribution[key as keyof typeof distribution].value}
                            onChange={(e) => handleDistributionChange(key, parseFloat(e.target.value) || 0)}
                            className="input-enhanced glass-card snarbles-border-glow"
                          />
                          <div className="w-10 text-center flex items-center text-muted-foreground">
                            <span className="text-sm font-mono">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 pt-4 border-t border-border glass-card snarbles-border-glow">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${healthIndicator.color}`}>
                    <Shield className="w-5 h-5" />
                    <div className="flex-1 text-muted-foreground">
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <p className="font-semibold text-muted-foreground">Tokenomics Health Score: {healthScore}%</p>
                        <div className="flex items-center text-muted-foreground">
                          {healthIndicator.icon}
                          <span className="text-sm ml-1 text-muted-foreground">{healthIndicator.label}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full mt-2 glass-card snarbles-border-glow">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${healthScore}%`,
                            background: healthScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                       healthScore >= 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                       healthScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                          'linear-gradient(90deg, #ef4444, #f87171)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                onClick={saveTokenomics}
                variant="outline" 
                className={`flex-1 transition-all duration-300 ${
                  savedSuccess 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
              <Button 
                onClick={applyToToken} 
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Apply to Token
              </Button>
            </div>
          </div>
          
          {/* Right Column - Visualization */}
          <div className="lg:col-span-7 space-y-6">
            {/* Distribution Chart */}
            <Card className="glass-card-premium snarbles-border-glow snarbles-animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-red-500" />
                  <span className="snarbles-subheading">Distribution Visualization</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Visual breakdown of your token allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-[300px] sm:h-[400px] flex items-center justify-center glass-card rounded-xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDistributionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                        >
                          {getDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="flex flex-col justify-center space-y-3 glass-card rounded-xl p-4">
                    <h4 className="font-semibold mb-2 snarbles-subheading">Distribution</h4>
                                          {getDistributionData().map((entry, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate text-muted-foreground">
                                {entry.name}
                              </span>
                              <span className="text-sm font-bold ml-2 text-muted-foreground">
                                {entry.value}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground-muted">
                              {(totalSupply * (entry.value / 100)).toLocaleString()} tokens
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Distribution Table */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-4 snarbles-subheading">Token Allocation Breakdown</h3>
                  
                  {/* Mobile View */}
                  <div className="lg:hidden space-y-3">
                    {Object.keys(distribution).map(key => {
                      const tokenAmount = totalSupply * (distribution[key as keyof typeof distribution].value / 100);
                      const hasVesting = vestingEnabled && 
                        (key === 'team' || key === 'investors' || key === 'advisors');
                      
                                              return (
                          <div key={key} className="p-4 glass-card rounded-lg border border-border/20">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: distribution[key as keyof typeof distribution].color }}
                                />
                                <span className="font-medium text-muted-foreground">{distribution[key as keyof typeof distribution].label}</span>
                              </div>
                              <span className="font-mono text-lg font-semibold text-muted-foreground">{distribution[key as keyof typeof distribution].value}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground-muted">
                              <span>Tokens: {formatNumber(Math.round(tokenAmount))}</span>
                              {hasVesting && vestingSchedule[key as keyof typeof vestingSchedule] && typeof vestingSchedule[key as keyof typeof vestingSchedule] === 'object' && (
                                <span>Vesting: {(vestingSchedule[key as keyof typeof vestingSchedule] as any).period} months</span>
                              )}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                  
                  {/* Desktop View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground-muted font-medium">Category</th>
                          <th className="text-center py-3 px-4 text-muted-foreground-muted font-medium">Percentage</th>
                          <th className="text-right py-3 px-4 text-muted-foreground-muted font-medium">Token Amount</th>
                          {vestingEnabled && <th className="text-right py-3 px-4 text-muted-foreground-muted font-medium">Vesting</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(distribution).map(key => {
                          const tokenAmount = totalSupply * (distribution[key as keyof typeof distribution].value / 100);
                          const hasVesting = vestingEnabled && 
                            (key === 'team' || key === 'investors' || key === 'advisors');
                          
                          return (
                            <tr key={key} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: distribution[key as keyof typeof distribution].color }}
                                  ></div>
                                  <span className="font-medium text-muted-foreground">{distribution[key as keyof typeof distribution].label}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="font-mono text-muted-foreground">{distribution[key as keyof typeof distribution].value}%</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono text-muted-foreground">{formatNumber(Math.round(tokenAmount))}</span>
                              </td>
                              {vestingEnabled && (
                                <td className="py-4 px-4 text-right text-muted-foreground">
                                  {hasVesting && vestingSchedule[key as keyof typeof vestingSchedule] && typeof vestingSchedule[key as keyof typeof vestingSchedule] === 'object' ? (
                                    <span className="text-sm text-muted-foreground">
                                      {(vestingSchedule[key as keyof typeof vestingSchedule] as any).period} months
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground text-muted-foreground">None</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recommendations */}
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader>
                <CardTitle className="text-muted-foreground">Expert Recommendations</CardTitle>
                <CardDescription className="text-muted-foreground">Based on your token distribution and market patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 glass-card snarbles-border-glow">
                  <div className="flex items-start space-x-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20 glass-card snarbles-border-glow">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-700 text-muted-foreground">Community-centric allocation</p>
                      <p className="text-sm text-green-600 text-muted-foreground">
                        Your {distribution.community.value}% community allocation supports organic growth and helps ensure broad distribution from launch.
                      </p>
                    </div>
                  </div>
                  
                  {distribution.team.value > 20 && (
                    <div className="flex items-start space-x-3 p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20 glass-card snarbles-border-glow">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-700 text-muted-foreground">Team allocation high</p>
                        <p className="text-sm text-yellow-600 text-muted-foreground">
                          Your team allocation of {distribution.team.value}% is above market average of 15-18%. Consider reducing or extending vesting.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {distribution.liquidity.value < 15 && (
                    <div className="flex items-start space-x-3 p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20 glass-card snarbles-border-glow">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-700 text-muted-foreground">Consider increasing liquidity</p>
                        <p className="text-sm text-yellow-600 text-muted-foreground">
                          Liquidity allocation of {distribution.liquidity.value}% may lead to higher price volatility. 15-20% is recommended.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {vestingEnabled && (
                    <div className="flex items-start space-x-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20 glass-card snarbles-border-glow">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-700 text-muted-foreground">Vesting schedule</p>
                        <p className="text-sm text-green-600 text-muted-foreground">
                          Your vesting schedules demonstrate long-term commitment and reduces selling pressure after launch.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3 p-4 glass-card rounded-lg border border-border/20 mt-4">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 snarbles-animate-pulse" />
                    <div>
                      <p className="font-medium snarbles-subheading">Tokenomics Health Score: {healthScore}/100</p>
                      <div className="w-full h-3 bg-black/20 rounded-full mt-2 mb-3 overflow-hidden">
                        <div 
                          className="h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${healthScore}%`,
                            background: healthScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                       healthScore >= 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                       healthScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                          'linear-gradient(90deg, #ef4444, #f87171)'
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {healthScore >= 80 ? 'Excellent tokenomics design with balanced allocations and strong governance mechanisms.' :
                         healthScore >= 60 ? 'Good tokenomics with some room for improvement. Consider adjustments to optimize distribution.' :
                         healthScore >= 40 ? 'Basic tokenomics with several areas that need attention for long-term success.' :
                                           'Significant improvements needed. Current design may lead to centralization or poor incentives.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Export and Apply */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={exportTokenomics}
                variant="outline" 
                className="border-border hover:bg-muted flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button 
                onClick={applyToToken}
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Apply to Token Creation
              </Button>
            </div>
          </div>
        </div>
        
        {/* Template Gallery */}
        <div className="mt-16 space-y-6 snarbles-animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-bold snarbles-subheading">Tokenomics Templates Gallery</h2>
            <p className="text-muted-foreground-muted">Start with a proven template based on your project's needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card-premium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle className="snarbles-subheading">DeFi Protocol</CardTitle>
                <CardDescription className="text-muted-foreground">Optimized for decentralized finance applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-muted">Community</span>
                  <span className="font-semibold text-muted-foreground">40%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-muted">Team</span>
                  <span className="font-semibold text-muted-foreground">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-muted">Treasury</span>
                  <span className="font-semibold text-muted-foreground">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-muted">Liquidity</span>
                  <span className="font-semibold text-muted-foreground">20%</span>
                </div>
                
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => applyTemplate('defi')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card-premium hover:scale-105 transition-all duration-300 cursor-pointer glass-card snarbles-border-glow">
              <CardHeader>
                <CardTitle className="text-muted-foreground">DAO Governance</CardTitle>
                <CardDescription className="text-muted-foreground">Balanced model for decentralized governance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 glass-card snarbles-border-glow">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Community</span>
                  <span className="font-semibold text-muted-foreground">60%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Team</span>
                  <span className="font-semibold text-muted-foreground">10%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Investors</span>
                  <span className="font-semibold text-muted-foreground">15%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Treasury</span>
                  <span className="font-semibold text-muted-foreground">15%</span>
                </div>
                
                <Button className="w-full" onClick={() => applyTemplate('dao')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card-premium hover:scale-105 transition-all duration-300 cursor-pointer glass-card snarbles-border-glow">
              <CardHeader>
                <CardTitle className="text-muted-foreground">GameFi Project</CardTitle>
                <CardDescription className="text-muted-foreground">Optimized for gaming and metaverse projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 glass-card snarbles-border-glow">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Players & Rewards</span>
                  <span className="font-semibold text-muted-foreground">35%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Team</span>
                  <span className="font-semibold text-muted-foreground">18%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Investors</span>
                  <span className="font-semibold text-muted-foreground">22%</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-muted-foreground text-muted-foreground">Marketing</span>
                  <span className="font-semibold text-muted-foreground">25%</span>
                </div>
                
                <Button className="w-full" onClick={() => applyTemplate('gamefi')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Expert Recommendations */}
        <div className="mt-20 text-center snarbles-animate-fade-in">
          <Link href="/create">
            <Button className="bg-primary hover:bg-primary/90 text-lg px-8 py-4 font-semibold">
              <Rocket className="w-5 h-5 mr-2" />
              Create Your Token Now
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">Apply this tokenomics design directly to your token creation</p>
        </div>
      </div>
    </div>
  );
}