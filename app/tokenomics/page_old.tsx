'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Cell, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { 
  Calculator, 
  Download, 
  PieChart as PieChartIcon,
  ChevronRight, 
  Check, 
  AlertTriangle, 
  Shield, 
  Settings,
  Copy,
  Rocket,
  Sparkles,
  BarChart3,
  Users,
  Gamepad2,
  Building,
  Coins,
  DollarSign,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';

// Simple explanations for each allocation type
const allocationExplanations = {
  team: {
    title: 'Team & Advisors',
    simple: 'Tokens for the people building your project',
    detailed: 'Usually locked for 1-4 years to show long-term commitment. Industry standard: 10-20%'
  },
  investors: {
    title: 'Investors & VCs',
    simple: 'Tokens for people who funded your project',
    detailed: 'Private sale participants and venture capital firms. Typically locked 6-24 months'
  },
  community: {
    title: 'Community & Users',
    simple: 'Tokens to reward your users and community',
    detailed: 'Airdrops, rewards, incentives. Higher = more community-owned. Ideal: 25-50%'
  },
  liquidity: {
    title: 'Trading & Liquidity',
    simple: 'Tokens for exchanges so people can buy/sell',
    detailed: 'DEX pools, CEX listings, market making. Essential for price stability'
  },
  marketing: {
    title: 'Growth & Marketing',
    simple: 'Tokens for partnerships and growth',
    detailed: 'Influencer partnerships, ecosystem growth, strategic initiatives'
  },
  reserve: {
    title: 'Treasury & Reserve',
    simple: 'Emergency fund for unexpected opportunities',
    detailed: 'Future development, emergency situations, strategic acquisitions'
  }
};

// Define distribution categories with default values
const defaultDistribution = {
  team: { label: 'Team', value: 15, color: '#FF6B6B' },
  investors: { label: 'Investors', value: 20, color: '#4ECDC4' },
  community: { label: 'Community', value: 30, color: '#FFD166' },
  liquidity: { label: 'Liquidity', value: 15, color: '#6A0572' },
  marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
  reserve: { label: 'Reserve', value: 10, color: '#3A86FF' }
};

export default function TokenomicsPage() {
  // State for token supply and distribution
  const [totalSupply, setTotalSupply] = useState(100000000);
  const [distribution, setDistribution] = useState(defaultDistribution);
  const [supplyType, setSupplyType] = useState('fixed');
  const [healthScore, setHealthScore] = useState(78);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if we're applying tokenomics from saved config
  useEffect(() => {
    const applyParam = searchParams?.get('apply');
    if (applyParam === 'true') {
      try {
        const saved = localStorage.getItem('snarbles_tokenomics');
        if (saved) {
          const data = JSON.parse(saved);
          
          if (data.totalSupply) setTotalSupply(data.totalSupply);
          if (data.distribution) setDistribution(data.distribution);
          if (data.supplyType) setSupplyType(data.supplyType);
          if (data.healthScore) setHealthScore(data.healthScore);
          if (data.projectName) setProjectName(data.projectName);
          if (data.projectDescription) setProjectDescription(data.projectDescription);
          
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      } catch (err) {
        console.error('Failed to load tokenomics data:', err);
      }
    }
  }, [searchParams]);

  // Calculate simple health score
  const calculateHealthScore = () => {
    const communityPercent = distribution.community.value;
    const teamPercent = distribution.team.value;
    const totalPercent = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);
    
    let score = 50; // Base score
    
    // Check if total adds up to 100%
    if (Math.abs(totalPercent - 100) <= 1) score += 20;
    else if (Math.abs(totalPercent - 100) <= 5) score += 10;
    
    // Community allocation (higher is better)
    if (communityPercent >= 30) score += 20;
    else if (communityPercent >= 20) score += 15;
    else if (communityPercent >= 10) score += 5;
    
    // Team allocation (15-25% is ideal)
    if (teamPercent >= 10 && teamPercent <= 25) score += 10;
    else if (teamPercent < 35) score += 5;
    
    return Math.min(100, Math.max(0, score));
  };
  
  // Calculate health score whenever distribution changes
  useEffect(() => {
    const newScore = calculateHealthScore();
    setHealthScore(newScore);
  }, [distribution]);
  
  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      supplyType,
      healthScore,
      projectName,
      projectDescription,
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
      
      // Header with project info
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Tokenomics Report", 105, 25, { align: "center" });
      
      if (projectName) {
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.text(projectName, 105, 40, { align: "center" });
      }
      
      if (projectDescription) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        const splitDescription = doc.splitTextToSize(projectDescription, 170);
        doc.text(splitDescription, 105, 50, { align: "center" });
      }
      
      // Token details section
      let yPosition = projectDescription ? 70 : projectName ? 55 : 45;
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Token Overview", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Supply: ${formatNumber(totalSupply)} tokens`, 20, yPosition);
      yPosition += 8;
      doc.text(`Supply Type: ${supplyType.charAt(0).toUpperCase() + supplyType.slice(1)}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Health Score: ${healthScore}/100`, 20, yPosition);
      yPosition += 20;
      
      // Distribution table
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Token Distribution", 20, yPosition);
      yPosition += 15;
      
      // Table headers
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Category", 20, yPosition);
      doc.text("Percentage", 80, yPosition);
      doc.text("Token Amount", 130, yPosition);
      doc.text("Purpose", 180, yPosition);
      
      // Table line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition + 2, 200, yPosition + 2);
      yPosition += 10;
      
      // Distribution data
      doc.setFont("helvetica", "normal");
      distributionData.forEach((item) => {
        const explanation = allocationExplanations[
          Object.keys(distribution).find(key => 
            distribution[key as keyof typeof distribution].label === item.name
          ) as keyof typeof allocationExplanations
        ];
        
        doc.text(item.name, 20, yPosition);
        doc.text(`${item.value}%`, 80, yPosition);
        doc.text(formatNumber(item.amount), 130, yPosition);
        
        // Wrap purpose text
        const purposeText = explanation?.simple || '';
        const wrappedPurpose = doc.splitTextToSize(purposeText, 40);
        doc.text(wrappedPurpose, 180, yPosition);
        
        yPosition += Math.max(8, wrappedPurpose.length * 4);
      });
      
      // Health analysis
      yPosition += 15;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Tokenomics Analysis", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      let analysisText = '';
      
      if (healthScore >= 80) {
        analysisText = '🎉 Excellent! Your tokenomics design shows strong balance and follows industry best practices. The distribution promotes healthy token economics with good community incentives.';
      } else if (healthScore >= 60) {
        analysisText = '👍 Good foundation with room for optimization. Your tokenomics are solid but could benefit from minor adjustments to improve balance and community alignment.';
      } else {
        analysisText = '⚠️ Consider rebalancing your distribution. Current allocation may create challenges for community growth or long-term sustainability.';
      }
      
      const wrappedAnalysis = doc.splitTextToSize(analysisText, 170);
      doc.text(wrappedAnalysis, 20, yPosition);
      yPosition += wrappedAnalysis.length * 6;
      
      // Recommendations
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Recommendations", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const recommendations = [];
      
      if (distribution.community.value >= 30) {
        recommendations.push('✓ Strong community allocation supports organic growth');
      } else {
        recommendations.push('• Consider increasing community allocation to 25-40%');
      }
      
      if (distribution.team.value <= 25) {
        recommendations.push('✓ Team allocation shows commitment to fairness');
      } else {
        recommendations.push('• Team allocation above 25% may raise centralization concerns');
      }
      
      if (distribution.liquidity.value >= 15) {
        recommendations.push('✓ Adequate liquidity allocation for price stability');
      } else {
        recommendations.push('• Consider allocating 15-20% for liquidity to reduce volatility');
      }
      
      recommendations.forEach(rec => {
        doc.text(rec, 25, yPosition);
        yPosition += 6;
      });
      
      // Footer
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Generated on ${currentDate} via Snarbles Tokenomics Designer`, 105, 280, { align: "center" });
      doc.text('https://snarbles.com/tokenomics', 105, 290, { align: "center" });
      
      // Save the PDF
      const fileName = projectName 
        ? `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_tokenomics_${new Date().toISOString().split('T')[0]}.pdf`
        : `tokenomics_report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(fileName);
      
      toast({
        title: "Export Complete!",
        description: `Your tokenomics report has been downloaded as ${fileName}`
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Tokenomics Designer...</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center space-x-3 glass-card px-6 py-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="uppercase tracking-wider text-primary font-bold text-sm">Interactive Designer</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Design Your Token 
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Distribution</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Create custom tokenomics with our interactive designer. Adjust distributions in real-time and see instant feedback.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Project Info & Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Project Information */}
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Project Information</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Tell us about your project (optional, for PDF reports)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-foreground">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., My Awesome Token"
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDescription" className="text-foreground">Description</Label>
                  <Input
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Brief description of your project..."
                    className="text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Token Supply */}
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Total Token Supply</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  How many tokens will exist in total?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(parseInt(e.target.value) || 0)}
                    className="text-xl font-mono text-center text-foreground"
                    placeholder="100,000,000"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalSupply(1000000)}
                      className="border-border hover:bg-muted text-xs"
                    >
                      1M
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalSupply(10000000)}
                      className="border-border hover:bg-muted text-xs"
                    >
                      10M
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalSupply(100000000)}
                      className="border-border hover:bg-muted text-xs"
                    >
                      100M
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalSupply(1000000000)}
                      className="border-border hover:bg-muted text-xs"
                    >
                      1B
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Most successful tokens use 10M - 1B supply
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Controls */}
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Token Distribution</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Drag sliders to adjust how tokens are allocated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.keys(distribution).map((key) => {
                  const allocation = distribution[key as keyof typeof distribution];
                  const explanation = allocationExplanations[key as keyof typeof allocationExplanations];
                  const tokenAmount = Math.round(totalSupply * allocation.value / 100);
                  
                  return (
                    <div key={key} className="space-y-3 p-4 glass-card rounded-lg border border-border/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: allocation.color }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground text-sm">{explanation.title}</h4>
                            <p className="text-xs text-muted-foreground">{explanation.simple}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-foreground">{allocation.value}%</div>
                          <div className="text-xs text-muted-foreground">
                            {tokenAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <Slider
                        value={[allocation.value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(values) => handleDistributionChange(key, values[0])}
                        className="w-full"
                      />
                      
                      <p className="text-xs text-muted-foreground">{explanation.detailed}</p>
                    </div>
                  );
                })}
                
                {/* Total Check */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total:</span>
                    <span className={`font-mono text-lg ${
                      Math.round(Object.values(distribution).reduce((sum, item) => sum + item.value, 0)) === 100 
                        ? 'text-green-500' 
                        : 'text-yellow-500'
                    }`}>
                      {Math.round(Object.values(distribution).reduce((sum, item) => sum + item.value, 0))}%
                    </span>
                  </div>
                  {Math.round(Object.values(distribution).reduce((sum, item) => sum + item.value, 0)) !== 100 && (
                    <p className="text-xs text-yellow-500 mt-1">
                      ⚠️ Total should equal 100%
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Score */}
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Tokenomics Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">Overall Score</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-foreground">{healthScore}%</span>
                      {healthScore >= 80 ? (
                        <div className="text-green-500"><Check className="w-5 h-5" /></div>
                      ) : healthScore >= 60 ? (
                        <div className="text-blue-500"><Shield className="w-5 h-5" /></div>
                      ) : (
                        <div className="text-yellow-500"><AlertTriangle className="w-5 h-5" /></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${healthScore}%`,
                        background: healthScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                   healthScore >= 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                                      'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      }}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {healthScore >= 80 ? '🎉 Excellent! Your tokenomics look great!' :
                     healthScore >= 60 ? '👍 Good setup with room for improvement' :
                                       '⚠️ Consider adjusting for better balance'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={applyToToken}
                className="bg-primary hover:bg-primary/90 text-lg py-4 font-semibold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Create Token with This Setup
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={saveTokenomics}
                  variant="outline"
                  className={`border-border hover:bg-muted ${savedSuccess ? 'text-green-500 border-green-500' : ''}`}
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={exportTokenomics}
                  variant="outline"
                  className="border-border hover:bg-muted"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="text-center">
              <Button 
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-muted-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </Button>
            </div>

            {showAdvanced && (
              <Card className="glass-card-premium snarbles-border-glow">
                <CardHeader>
                  <CardTitle className="text-foreground">Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Supply Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['fixed', 'inflationary', 'deflationary'].map((type) => (
                        <Button
                          key={type}
                          variant={supplyType === type ? 'default' : 'outline'}
                          onClick={() => setSupplyType(type)}
                          className={`text-sm ${
                            supplyType === type 
                              ? 'bg-primary hover:bg-primary/90' 
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Visual Preview */}
          <div className="lg:col-span-7">
            <Card className="glass-card-premium snarbles-border-glow sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Live Preview</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  See your tokenomics in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-[300px] flex items-center justify-center glass-card rounded-xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDistributionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {getDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Distribution List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Token Breakdown</h4>
                    {getDistributionData().map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 glass-card rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium text-foreground">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">{entry.value}%</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {totalSupply >= 1000000000 ? `${(totalSupply / 1000000000).toFixed(1)}B` :
                       totalSupply >= 1000000 ? `${(totalSupply / 1000000).toFixed(0)}M` :
                       totalSupply >= 1000 ? `${(totalSupply / 1000).toFixed(0)}K` : totalSupply}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Supply</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{distribution.community.value}%</div>
                    <div className="text-sm text-muted-foreground">Community</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{healthScore}</div>
                    <div className="text-sm text-muted-foreground">Health Score</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(Object.values(distribution).reduce((sum, item) => sum + item.value, 0))}%
                    </div>
                    <div className="text-sm text-muted-foreground">Total Allocated</div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="mt-6 p-4 glass-card rounded-lg border border-border/20">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-primary" />
                    Quick Tips
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {distribution.community.value >= 30 && (
                      <div className="flex items-start space-x-2">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Great community allocation! This encourages adoption.</span>
                      </div>
                    )}
                    {distribution.team.value <= 25 && (
                      <div className="flex items-start space-x-2">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Team allocation shows commitment to fairness.</span>
                      </div>
                    )}
                    {distribution.liquidity.value >= 15 && (
                      <div className="flex items-start space-x-2">
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Good liquidity allocation for price stability.</span>
                      </div>
                    )}
                    {distribution.team.value > 30 && (
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>Team allocation is high - consider reducing to build trust.</span>
                      </div>
                    )}
                    {distribution.community.value < 20 && (
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>Consider increasing community allocation for better adoption.</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card-premium p-8 snarbles-border-glow max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to create your token?
            </h3>
            <p className="text-muted-foreground mb-6">
              Your tokenomics are designed! Apply them directly to our token creation tool.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={applyToToken}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-4 font-semibold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Create Token Now
              </Button>
              <Link href="/create">
                <Button variant="outline" className="border-border hover:bg-muted text-lg px-8 py-4">
                  Browse Token Creator
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
