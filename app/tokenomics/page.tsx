'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
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
  Coins,
  Zap
} from 'lucide-react';

// Simple explanations for each allocation type
const allocationExplanations = {
  team: {
    title: 'Team & Advisors',
    description: 'Tokens allocated to founding team, employees, and advisory board members. Usually vested over time.',
    recommendation: '15-25% is standard'
  },
  investors: {
    title: 'Investors',
    description: 'Tokens sold to private investors, VCs, and strategic partners during funding rounds.',
    recommendation: '20-40% depending on funding needs'
  },
  community: {
    title: 'Community & Ecosystem',
    description: 'Tokens for community rewards, airdrops, governance participation, and ecosystem growth.',
    recommendation: '25-40% for healthy community engagement'
  },
  liquidity: {
    title: 'Liquidity & Market Making',
    description: 'Tokens reserved for DEX liquidity pools and market making activities.',
    recommendation: '10-20% for sufficient trading liquidity'
  },
  marketing: {
    title: 'Marketing & Partnerships',
    description: 'Tokens for marketing campaigns, partnerships, influencer collaborations, and growth initiatives.',
    recommendation: '5-15% for effective market penetration'
  },
  reserve: {
    title: 'Treasury & Reserve',
    description: 'Strategic reserve for future development, unexpected opportunities, and long-term sustainability.',
    recommendation: '10-20% for operational flexibility'
  }
};

// Default token distribution
const defaultDistribution = {
  team: { label: 'Team', value: 15, color: '#8B5CF6' },
  investors: { label: 'Investors', value: 20, color: '#4ECDC4' },
  community: { label: 'Community', value: 30, color: '#FFD166' },
  liquidity: { label: 'Liquidity', value: 15, color: '#6A0572' },
  marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
  reserve: { label: 'Reserve', value: 10, color: '#3A86FF' }
};

function TokenomicsPage() {
  const [totalSupply, setTotalSupply] = useState(100000000);
  const [distribution, setDistribution] = useState(defaultDistribution);
  const [healthScore, setHealthScore] = useState(78);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateHealthScore = () => {
      let score = 100;
      if (distribution.community.value < 20) score -= 15;
      if (distribution.team.value > 30) score -= 10;
      if (distribution.investors.value > 50) score -= 20;
      if (distribution.liquidity.value < 5) score -= 10;
      if (distribution.marketing.value < 3) score -= 5;
      if (distribution.reserve.value < 5) score -= 5;
      if (distribution.community.value >= 30) score += 5;
      if (distribution.liquidity.value >= 15) score += 5;
      setHealthScore(Math.max(0, Math.min(100, score)));
    };
    
    calculateHealthScore();
  }, [distribution]);

  const updateDistribution = (key: keyof DistributionMap, newValue: number) => {
    const currentTotal = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);
    const difference = newValue - distribution[key].value;
    
    if (currentTotal + difference <= 100) {
      setDistribution(prev => ({
        ...prev,
        [key]: { ...prev[key], value: newValue }
      }));
    }
  };

  const saveConfiguration = () => {
    localStorage.setItem('tokenomics-config', JSON.stringify({
      distribution,
      totalSupply,
      projectName,
      projectDescription,
      timestamp: Date.now()
    }));
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    
    toast({
      title: "Configuration Saved",
      description: "Your tokenomics configuration has been saved locally.",
    });
  };

  const generatePDFReport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFontSize(24);
      doc.setTextColor(139, 92, 246);
      doc.text('Tokenomics Report', pageWidth / 2, 30, { align: 'center' });
      
      if (projectName) {
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project: ${projectName}`, 20, 50);
      }
      
      let yPosition = 70;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Token Distribution', 20, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      
      Object.entries(distribution).forEach(([key, data]) => {
        const tokens = (totalSupply * data.value / 100).toLocaleString();
        doc.text(`${data.label}: ${data.value}% (${tokens} tokens)`, 25, yPosition);
        yPosition += 10;
      });
      
      yPosition += 10;
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94);
      doc.text(`Health Score: ${healthScore}/100`, 20, yPosition);
      
      const fileName = projectName ? `${projectName}-tokenomics.pdf` : 'tokenomics-report.pdf';
      doc.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Your tokenomics report has been downloaded as ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const applyToToken = () => {
    saveConfiguration();
    router.push('/create?from=tokenomics');
  };

  const totalPercentage = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);

  const ChartDisplay = () => (
    <div className="space-y-4">
      {Object.entries(distribution).map(([key, data]) => (
        <div key={key} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {((totalSupply * data.value) / 100).toLocaleString()} tokens
            </span>
            <span className="font-semibold">{data.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthScoreIcon = (score) => {
    if (score >= 80) return <Check className="w-5 h-5" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Tokenomics Designer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Tokenomics Designer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create balanced and sustainable token distributions with our interactive designer. 
              Get instant feedback and generate professional reports.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card className="glass-card border-0 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Project Information</span>
            </CardTitle>
            <CardDescription>
              Add your project details to generate personalized reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="Enter your project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="100000000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <textarea
                id="projectDescription"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your project and its mission..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-card border-0 bg-background/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5" />
                  <span>Token Allocation</span>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getHealthScoreColor(healthScore)}`}>
                  {getHealthScoreIcon(healthScore)}
                  <span className="ml-2">Health: {healthScore}/100</span>
                </div>
              </CardTitle>
              <CardDescription>
                Adjust token allocation percentages. Total must equal 100%.
                <span className={`ml-2 font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Current: {totalPercentage}%
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(distribution).map(([key, data]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{data.label}</Label>
                    <span className="text-sm font-semibold">{data.value}%</span>
                  </div>
                  <Slider
                    value={[data.value]}
                    onValueChange={(value) => updateDistribution(key, value[0])}
                    max={80}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {allocationExplanations[key]?.recommendation}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card border-0 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Distribution Overview</CardTitle>
                <CardDescription>
                  Visual representation of your token allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartDisplay />
              </CardContent>
            </Card>

            <Card className="glass-card border-0 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Export, save, or apply your tokenomics configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={generatePDFReport}
                  variant="outline" 
                  className="border-border hover:bg-muted"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  onClick={saveConfiguration}
                  variant="outline" 
                  className={`border-border hover:bg-muted ${savedSuccess ? 'bg-green-50 border-green-200' : ''}`}
                >
                  {savedSuccess ? <Check className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  {savedSuccess ? 'Saved!' : 'Save Config'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Ready to Create Your Token?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your tokenomics are configured. Apply this distribution to create your token 
              or explore our token creation tools.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
  );
}

export default TokenomicsPage;
