'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Rocket,
  BarChart3,
  RefreshCw,
  Eye,
  FileText,
  Share2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Enhanced interfaces
interface AllocationData {
  label: string;
  value: number;
  color: string;
}

interface DistributionMap {
  team: AllocationData;
  investors: AllocationData;
  community: AllocationData;
  liquidity: AllocationData;
  marketing: AllocationData;
  reserve: AllocationData;
}

interface HealthAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
  strengths: string[];
}

// Default distribution with better balance
const defaultDistribution: DistributionMap = {
  team: { label: 'Team', value: 15, color: '#8B5CF6' },
  investors: { label: 'Investors', value: 20, color: '#4ECDC4' },
  community: { label: 'Community', value: 35, color: '#FFD166' },
  liquidity: { label: 'Liquidity', value: 15, color: '#6A0572' },
  marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
  reserve: { label: 'Reserve', value: 5, color: '#3A86FF' }
};

function EnhancedTokenomicsPage() {
  const [totalSupply, setTotalSupply] = useState<number>(100000000);
  const [distribution, setDistribution] = useState<DistributionMap>(defaultDistribution);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis>({ score: 85, issues: [], recommendations: [], strengths: [] });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('allocation');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const analysis = calculateHealthAnalysis();
    setHealthAnalysis(analysis);
  }, [distribution, totalSupply]);

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

  // Comprehensive health analysis
  const calculateHealthAnalysis = (): HealthAnalysis => {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = [];
    
    const { team, investors, community, liquidity, marketing, reserve } = distribution;
    
    // Community allocation analysis
    if (community.value < 20) {
      score -= 20;
      issues.push('Low community allocation may limit adoption');
      recommendations.push('Increase community allocation to 25-35% for better engagement');
    } else if (community.value >= 30) {
      strengths.push('Strong community focus promotes sustainable growth');
      score += 5;
    }
    
    // Team allocation analysis
    if (team.value > 25) {
      score -= 25;
      issues.push('High team allocation raises investor concerns');
      recommendations.push('Reduce team allocation to under 20% with vesting');
    } else if (team.value <= 15) {
      strengths.push('Conservative team allocation builds trust');
      score += 5;
    }
    
    // Liquidity analysis
    if (liquidity.value < 10) {
      score -= 15;
      issues.push('Insufficient liquidity may impact trading');
      recommendations.push('Allocate 10-15% for healthy trading liquidity');
    } else if (liquidity.value >= 15) {
      strengths.push('Excellent liquidity allocation ensures smooth trading');
      score += 5;
    }
    
    // Supply analysis
    if (totalSupply > 100000000000) {
      score -= 10;
      issues.push('Very high token supply may affect perceived value');
      recommendations.push('Consider supply reduction or clear utility justification');
    } else if (totalSupply >= 1000000 && totalSupply <= 1000000000) {
      strengths.push('Token supply is within optimal range');
      score += 5;
    }
    
    // Overall balance check
    const publicAllocation = community.value + liquidity.value;
    if (publicAllocation >= 40) {
      strengths.push('High public allocation promotes decentralization');
      score += 5;
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations,
      strengths
    };
  };

  const saveConfiguration = () => {
    const config = {
      distribution,
      totalSupply,
      projectName,
      projectDescription,
      timestamp: Date.now()
    };
    
    localStorage.setItem('tokenomics-config', JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    
    toast({
      title: "✅ Configuration Saved",
      description: "Your tokenomics configuration has been saved locally.",
    });
  };

  // Enhanced PDF generation with better error handling
  const generatePDFReport = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = 25;

      // Title page
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('TOKENOMICS ANALYSIS', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
      
      yPos = 70;

      // Project overview
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Overview', margin, yPos);
      yPos += 15;

      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 40, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 40);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${projectName || 'Unnamed Token Project'}`, margin + 10, yPos + 8);
      doc.text(`Total Supply: ${totalSupply.toLocaleString()} tokens`, margin + 10, yPos + 18);
      doc.text(`Health Score: ${healthAnalysis.score}/100`, margin + 10, yPos + 28);

      yPos += 55;

      // Distribution breakdown
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Token Distribution', margin, yPos);
      yPos += 15;

      // Distribution table
      const distributionData = Object.entries(distribution);
      
      // Table headers
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Category', margin + 5, yPos + 7);
      doc.text('Percentage', margin + 60, yPos + 7);
      doc.text('Tokens', margin + 110, yPos + 7);
      
      yPos += 10;

      // Table rows
      distributionData.forEach(([key, data], index) => {
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
        }
        
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, yPos, pageWidth - (margin * 2), 10);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        doc.text(data.label, margin + 5, yPos + 7);
        doc.text(`${data.value}%`, margin + 60, yPos + 7);
        doc.text(Math.round((totalSupply * data.value) / 100).toLocaleString(), margin + 110, yPos + 7);
        
        yPos += 10;
      });

      yPos += 20;

      // Health analysis
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 25;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Health Analysis', margin, yPos);
      yPos += 15;

      // Strengths
      if (healthAnalysis.strengths.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94);
        doc.text('Strengths:', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        healthAnalysis.strengths.forEach(strength => {
          doc.text(`• ${strength}`, margin + 5, yPos);
          yPos += 8;
        });
        yPos += 5;
      }

      // Issues
      if (healthAnalysis.issues.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('Areas for Improvement:', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        healthAnalysis.issues.forEach(issue => {
          doc.text(`• ${issue}`, margin + 5, yPos);
          yPos += 8;
        });
        yPos += 5;
      }

      // Recommendations
      if (healthAnalysis.recommendations.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('Recommendations:', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        healthAnalysis.recommendations.forEach(rec => {
          doc.text(`• ${rec}`, margin + 5, yPos);
          yPos += 8;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('Generated by Snarbles Tokenomics Designer', margin, pageHeight - 15);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 15);
      }

      const fileName = projectName ? 
        `${projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-tokenomics.pdf` : 
        'tokenomics-analysis.pdf';
      
      doc.save(fileName);
      
      toast({
        title: "✅ PDF Generated Successfully!",
        description: `Your tokenomics report (${fileName}) has been downloaded with improved formatting.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "❌ Export Failed",
        description: "Unable to generate PDF. Please check your browser settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const applyToToken = () => {
    saveConfiguration();
    router.push('/create?from=tokenomics');
  };

  const totalPercentage = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);

  // Chart data
  const chartData = Object.entries(distribution).map(([key, data]) => ({
    name: data.label,
    value: data.value,
    fill: data.color,
    tokens: Math.round((totalSupply * data.value) / 100)
  }));

  const MobilePieChart = () => (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-primary">{data.value}%</p>
                    <p className="text-sm text-muted-foreground">
                      {data.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const MobileBarChart = () => (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-primary">{data.value}%</p>
                    <p className="text-sm text-muted-foreground">
                      {data.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Enhanced Tokenomics Designer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="relative container mx-auto px-4 py-8 sm:py-16">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-2 sm:mb-4">
              <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Enhanced Tokenomics Designer
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Create professional token distributions with enhanced PDF reports and real-time analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Project Information */}
        <Card className="glass-card border-0 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Project Setup</span>
            </CardTitle>
            <CardDescription>
              Configure your project details for personalized reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe your project and its mission..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Token Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <Card className="glass-card border-0 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <PieChartIcon className="w-5 h-5" />
                    <span>Token Distribution</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getHealthScoreColor(healthAnalysis.score)}`}>
                    Health Score: {healthAnalysis.score}/100
                  </div>
                </CardTitle>
                <CardDescription>
                  Adjust allocation percentages. Total: {totalPercentage}%
                  {totalPercentage !== 100 && (
                    <span className="text-red-500 ml-2">
                      (Must equal 100%)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(distribution).map(([key, data]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{data.label}</Label>
                      <span className="text-sm font-semibold bg-muted px-2 py-1 rounded">{data.value}%</span>
                    </div>
                    <Slider
                      value={[data.value]}
                      onValueChange={(value) => updateDistribution(key as keyof DistributionMap, value[0])}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tokens: {((totalSupply * data.value) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualize" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card border-0 bg-background/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChartIcon className="w-5 h-5" />
                    <span>Distribution Chart</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MobilePieChart />
                </CardContent>
              </Card>

              <Card className="glass-card border-0 bg-background/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Allocation Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MobileBarChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="glass-card border-0 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Health Analysis</span>
                  <Badge className={getHealthScoreColor(healthAnalysis.score)}>
                    {healthAnalysis.score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {healthAnalysis.strengths.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-600 flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>Strengths</span>
                    </h4>
                    <ul className="space-y-2">
                      {healthAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-green-200">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {healthAnalysis.issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-600 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Issues</span>
                    </h4>
                    <ul className="space-y-2">
                      {healthAnalysis.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-red-200">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {healthAnalysis.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-600 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Recommendations</span>
                    </h4>
                    <ul className="space-y-2">
                      {healthAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground pl-4 border-l-2 border-blue-200">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card className="glass-card border-0 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Actions</span>
            </CardTitle>
            <CardDescription>
              Export, save, or apply your tokenomics configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              onClick={generatePDFReport}
              disabled={isGeneratingPDF}
              variant="outline" 
              className="border-border hover:bg-muted relative"
            >
              {isGeneratingPDF ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export Enhanced PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
              {!isGeneratingPDF && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                  New
                </Badge>
              )}
            </Button>
            
            <Button 
              onClick={saveConfiguration}
              variant="outline" 
              className={`border-border hover:bg-muted ${savedSuccess ? 'bg-green-50 border-green-200' : ''}`}
            >
              {savedSuccess ? <Check className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              <span className="hidden sm:inline">{savedSuccess ? 'Saved!' : 'Save Config'}</span>
              <span className="sm:hidden">{savedSuccess ? 'Saved!' : 'Save'}</span>
            </Button>
            
            <Button 
              onClick={() => navigator.share?.({ 
                title: 'My Tokenomics', 
                text: `Check out my ${projectName || 'token'} tokenomics!`,
                url: window.location.href 
              })}
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">Share</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('visualize')}
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Preview</span>
              <span className="sm:hidden">View</span>
            </Button>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-6 py-8 sm:py-12">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">Ready to Create Your Token?</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Your enhanced tokenomics are configured with professional analysis. 
              Apply this distribution to create your token now.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <Button 
              onClick={applyToToken}
              className="bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold w-full sm:w-auto"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Create Token Now
            </Button>
            <Link href="/create" className="w-full sm:w-auto">
              <Button variant="outline" className="border-border hover:bg-muted text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full">
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

export default EnhancedTokenomicsPage;
