'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
  Zap,
  Info,
  TrendingUp,
  FileText,
  Share2,
  RefreshCw,
  Eye
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
  Legend
} from 'recharts';

// TypeScript interfaces for better type safety
interface AllocationData {
  label: string;
  value: number;
  color: string;
  tokens?: number;
}

interface DistributionMap {
  team: AllocationData;
  investors: AllocationData;
  community: AllocationData;
  liquidity: AllocationData;
  marketing: AllocationData;
  reserve: AllocationData;
}

interface ProjectConfig {
  distribution: DistributionMap;
  totalSupply: number;
  projectName: string;
  projectDescription: string;
  timestamp: number;
}

interface HealthAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
  strengths: string[];
}

// Simple explanations for each allocation type
const allocationExplanations: Record<keyof DistributionMap, {
  title: string;
  description: string;
  recommendation: string;
}> = {
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
  const [totalSupply, setTotalSupply] = useState<number>(100000000);
  const [distribution, setDistribution] = useState<DistributionMap>(defaultDistribution);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis>({ score: 78, issues: [], recommendations: [], strengths: [] });
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

  // Enhanced health score calculation with detailed analysis
  const calculateHealthAnalysis = (): HealthAnalysis => {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = [];
    
    // Total supply analysis
    if (totalSupply > 100000000000) { // 100B+
      score -= 15;
      issues.push('Extremely high token supply may cause perception issues');
      recommendations.push('Consider reducing total supply for better price psychology');
    } else if (totalSupply > 10000000000) { // 10B+
      score -= 10;
      issues.push('Very high token supply may impact perceived value');
      recommendations.push('Ensure clear utility justifies large supply');
    } else if (totalSupply < 1000000) { // <1M
      score -= 5;
      issues.push('Very low supply may limit accessibility and divisibility');
      recommendations.push('Consider if supply meets expected demand and usage');
    } else {
      strengths.push('Token supply is within reasonable range for most use cases');
    }
    
    // Community allocation analysis - Enhanced ranges
    if (distribution.community.value < 15) {
      score -= 20;
      issues.push('Critically low community allocation will limit organic growth');
      recommendations.push('Increase community allocation to at least 25% for sustainable growth');
    } else if (distribution.community.value < 20) {
      score -= 15;
      issues.push('Low community allocation may limit adoption and engagement');
      recommendations.push('Consider increasing community allocation to 25-35% for better network effects');
    } else if (distribution.community.value >= 35) {
      score += 10;
      strengths.push('Excellent community focus will drive strong adoption and retention');
    } else if (distribution.community.value >= 25) {
      score += 5;
      strengths.push('Strong community allocation promotes healthy ecosystem growth');
    }
    
    // Team allocation analysis - Enhanced ranges
    if (distribution.team.value > 35) {
      score -= 25;
      issues.push('Excessive team allocation is a major red flag for investors');
      recommendations.push('Reduce team allocation to under 20% and implement vesting schedules');
    } else if (distribution.team.value > 25) {
      score -= 15;
      issues.push('High team allocation may concern investors and community');
      recommendations.push('Consider reducing team allocation to 15-20% for better optics');
    } else if (distribution.team.value < 5) {
      score -= 10;
      issues.push('Very low team allocation may indicate lack of long-term commitment');
      recommendations.push('Ensure team has sufficient incentive for long-term development');
    } else if (distribution.team.value <= 15) {
      score += 5;
      strengths.push('Conservative team allocation builds trust and shows fair distribution');
    }
    
    // Investor allocation analysis - Enhanced ranges
    if (distribution.investors.value > 60) {
      score -= 30;
      issues.push('Extreme investor allocation indicates poor tokenomics design');
      recommendations.push('Drastically reduce investor allocation to under 35%');
    } else if (distribution.investors.value > 40) {
      score -= 20;
      issues.push('High investor allocation may indicate over-reliance on external funding');
      recommendations.push('Balance investor allocation with community and utility allocations');
    } else if (distribution.investors.value > 30) {
      score -= 10;
      issues.push('Moderate investor allocation - ensure proper vesting schedules');
      recommendations.push('Implement graduated vesting to prevent early selling pressure');
    } else if (distribution.investors.value <= 20) {
      score += 5;
      strengths.push('Balanced investor allocation maintains healthy token distribution');
    }
    
    // Liquidity analysis - Enhanced ranges
    if (distribution.liquidity.value < 3) {
      score -= 20;
      issues.push('Critical liquidity shortage will severely impact trading and adoption');
      recommendations.push('Allocate at least 8-12% for liquidity to ensure healthy trading');
    } else if (distribution.liquidity.value < 8) {
      score -= 15;
      issues.push('Insufficient liquidity allocation will hurt trading experience');
      recommendations.push('Increase liquidity allocation to 10-15% for optimal trading conditions');
    } else if (distribution.liquidity.value >= 20) {
      score -= 5;
      issues.push('Very high liquidity allocation may be inefficient');
      recommendations.push('Consider if >20% liquidity allocation is necessary');
    } else if (distribution.liquidity.value >= 12) {
      score += 10;
      strengths.push('Excellent liquidity allocation ensures smooth trading and price stability');
    } else if (distribution.liquidity.value >= 8) {
      score += 5;
      strengths.push('Good liquidity allocation supports healthy trading environment');
    }
    
    // Marketing allocation analysis - Enhanced ranges
    if (distribution.marketing.value < 2) {
      score -= 10;
      issues.push('Minimal marketing allocation may severely limit growth potential');
      recommendations.push('Allocate 5-10% for marketing, partnerships, and business development');
    } else if (distribution.marketing.value < 5) {
      score -= 5;
      issues.push('Low marketing allocation may limit growth and awareness');
      recommendations.push('Consider increasing marketing budget to 7-12% for better market penetration');
    } else if (distribution.marketing.value > 20) {
      score -= 10;
      issues.push('Excessive marketing allocation may indicate lack of organic value');
      recommendations.push('Reduce marketing allocation and focus on product-market fit');
    } else if (distribution.marketing.value >= 8) {
      score += 5;
      strengths.push('Solid marketing allocation enables effective growth and partnerships');
    }
    
    // Reserve allocation analysis - Enhanced ranges
    if (distribution.reserve.value < 3) {
      score -= 10;
      issues.push('Minimal reserve allocation limits future flexibility and development');
      recommendations.push('Maintain 8-15% reserve for future development and unexpected needs');
    } else if (distribution.reserve.value > 25) {
      score -= 15;
      issues.push('Excessive reserve allocation may indicate poor planning or centralization risk');
      recommendations.push('Reduce reserve allocation to 10-18% and clearly define usage criteria');
    } else if (distribution.reserve.value <= 15) {
      score += 5;
      strengths.push('Balanced reserve allocation provides flexibility without centralization');
    }
    
    // Cross-allocation analysis for advanced insights
    const publicAllocation = distribution.community.value + distribution.liquidity.value;
    const privateAllocation = distribution.team.value + distribution.investors.value;
    
    if (privateAllocation > 50) {
      score -= 15;
      issues.push('Combined team+investor allocation exceeds 50% - high centralization risk');
      recommendations.push('Redistribute tokens to increase decentralization and public allocation');
    } else if (privateAllocation <= 30) {
      score += 10;
      strengths.push('Low private allocation promotes decentralization and community ownership');
    }
    
    if (publicAllocation >= 40) {
      score += 10;
      strengths.push('High public allocation (community+liquidity) promotes decentralization');
    } else if (publicAllocation < 25) {
      score -= 10;
      issues.push('Low public allocation may limit decentralization and adoption');
      recommendations.push('Increase combined community and liquidity allocation to 35%+');
    }
    
    // Utility and sustainability analysis
    const utilityAllocation = distribution.community.value + distribution.marketing.value + distribution.reserve.value;
    if (utilityAllocation >= 50) {
      score += 5;
      strengths.push('Strong utility-focused allocation supports long-term sustainability');
    } else if (utilityAllocation < 30) {
      score -= 5;
      issues.push('Low utility allocation may impact long-term token value and ecosystem growth');
      recommendations.push('Increase allocations for community rewards, marketing, and development');
    }
    
    // Supply concentration analysis
    const topTwoAllocations = Object.values(distribution)
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .reduce((sum, allocation) => sum + allocation.value, 0);
    
    if (topTwoAllocations > 70) {
      score -= 10;
      issues.push('High concentration in top two categories increases centralization risk');
      recommendations.push('Diversify token distribution across more categories for better balance');
    } else if (topTwoAllocations <= 50) {
      score += 5;
      strengths.push('Well-distributed allocation reduces concentration risk');
    }
    
    // Add supply-specific recommendations
    if (totalSupply >= 1000000000) {
      recommendations.push('With high token supply, focus on clear utility and burn mechanisms');
    } else if (totalSupply <= 10000000) {
      recommendations.push('With limited supply, ensure sufficient decimal places for micro-transactions');
    }
    
    // Score normalization and bounds
    const finalScore = Math.max(0, Math.min(100, score));
    
    // Add final recommendations based on overall score
    if (finalScore < 60) {
      recommendations.unshift('Critical: This tokenomics structure needs major revisions before launch');
    } else if (finalScore < 75) {
      recommendations.unshift('Moderate concerns: Address key issues before proceeding to market');
    } else if (finalScore >= 85) {
      strengths.unshift('Excellent tokenomics structure with strong fundamentals');
    }
    
    return {
      score: finalScore,
      issues,
      recommendations,
      strengths
    };
  };

  const saveConfiguration = () => {
    const config: ProjectConfig = {
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
      title: "Configuration Saved",
      description: "Your tokenomics configuration has been saved locally.",
    });
  };

  const generatePDFReport = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      
      // Helper functions for PDF generation
      const addNewPageIfNeeded = (currentY: number, spaceNeeded: number) => {
        if (currentY + spaceNeeded > pageHeight - 30) {
          doc.addPage();
          return 40; // Start position on new page
        }
        return currentY;
      };
      
      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        doc.setFontSize(fontSize);
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const width = doc.getTextWidth(testLine);
          
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      
      // Calculate comprehensive metrics
      const totalTokens = Object.values(distribution).reduce((sum, data) => sum + (totalSupply * data.value / 100), 0);
      const liquidityRatio = distribution.liquidity.value / 100;
      const communityRatio = distribution.community.value / 100;
      const teamRatio = distribution.team.value / 100;
      const reserveRatio = distribution.reserve.value / 100;
      
      // Risk assessment based on distribution
      const getRiskLevel = () => {
        if (teamRatio > 0.25) return { level: 'High', color: [239, 68, 68] as const, reason: 'Team allocation exceeds 25%' };
        if (liquidityRatio < 0.05) return { level: 'High', color: [239, 68, 68] as const, reason: 'Insufficient liquidity allocation' };
        if (communityRatio < 0.20) return { level: 'Medium', color: [251, 146, 60] as const, reason: 'Low community allocation' };
        if (reserveRatio > 0.20) return { level: 'Medium', color: [251, 146, 60] as const, reason: 'High reserve allocation' };
        return { level: 'Low', color: [34, 197, 94] as const, reason: 'Well-balanced distribution' };
      };
      
      const riskAssessment = getRiskLevel();
      
      // Market cap scenarios based on supply
      const getMarketCapScenarios = () => {
        const scenarios = [
          { name: 'Conservative', pricePerToken: totalSupply > 1000000000 ? 0.001 : totalSupply > 100000000 ? 0.01 : 0.1 },
          { name: 'Moderate', pricePerToken: totalSupply > 1000000000 ? 0.01 : totalSupply > 100000000 ? 0.1 : 1 },
          { name: 'Optimistic', pricePerToken: totalSupply > 1000000000 ? 0.1 : totalSupply > 100000000 ? 1 : 10 }
        ];
        
        return scenarios.map(scenario => ({
          ...scenario,
          marketCap: totalSupply * scenario.pricePerToken,
          liquidityValue: (totalSupply * liquidityRatio) * scenario.pricePerToken,
          teamValue: (totalSupply * teamRatio) * scenario.pricePerToken
        }));
      };
      
      const marketScenarios = getMarketCapScenarios();
      
      // PAGE 1: EXECUTIVE SUMMARY
      let yPos = 20;
      
      // Professional Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('TOKENOMICS ANALYSIS REPORT', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Professional Token Economy Assessment • ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
      
      yPos = 70;
      
      // Project Overview Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT OVERVIEW', margin, yPos);
      yPos += 15;
      
      // Project details box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos - 5, maxLineWidth, 60, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos - 5, maxLineWidth, 60);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Project Name: ${projectName || 'Unnamed Token Project'}`, margin + 10, yPos + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Supply: ${totalSupply.toLocaleString()} tokens`, margin + 10, yPos + 25);
      doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, margin + 10, yPos + 40);
      
      // Health Score with visual indicator
      const healthColor = healthAnalysis.score >= 80 ? [34, 197, 94] as const : 
                         healthAnalysis.score >= 60 ? [251, 146, 60] as const : [239, 68, 68] as const;
      
      doc.setTextColor(healthColor[0], healthColor[1], healthColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`Overall Health Score: ${healthAnalysis.score}/100`, margin + 120, yPos + 25);
      
      yPos += 80;
      
      // Executive Summary
      yPos = addNewPageIfNeeded(yPos, 80);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', margin, yPos);
      yPos += 15;
      
      const executiveSummary = `This comprehensive tokenomics analysis evaluates the economic structure of ${projectName || 'your token project'}. 
      With a total supply of ${totalSupply.toLocaleString()} tokens, the project demonstrates a ${riskAssessment.level.toLowerCase()} risk profile. 
      Key findings include ${communityRatio >= 0.3 ? 'strong community focus' : communityRatio >= 0.2 ? 'moderate community allocation' : 'limited community incentives'}, 
      ${liquidityRatio >= 0.15 ? 'robust liquidity provisions' : liquidityRatio >= 0.05 ? 'adequate liquidity planning' : 'concerning liquidity limitations'}, 
      and ${teamRatio <= 0.15 ? 'conservative team allocation' : teamRatio <= 0.25 ? 'standard team rewards' : 'elevated team concentration'}.`;
      
      const summaryLines = wrapText(executiveSummary, maxLineWidth - 20, 12);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      summaryLines.forEach(line => {
        doc.text(line, margin + 10, yPos);
        yPos += 8;
      });
      
      yPos += 20;
      
      // Risk Assessment Box
      yPos = addNewPageIfNeeded(yPos, 50);
      doc.setFillColor(riskAssessment.color[0], riskAssessment.color[1], riskAssessment.color[2], 0.1);
      doc.rect(margin, yPos - 5, maxLineWidth, 40, 'F');
      doc.setDrawColor(riskAssessment.color[0], riskAssessment.color[1], riskAssessment.color[2]);
      doc.rect(margin, yPos - 5, maxLineWidth, 40);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(riskAssessment.color[0], riskAssessment.color[1], riskAssessment.color[2]);
      doc.text(`RISK LEVEL: ${riskAssessment.level.toUpperCase()}`, margin + 10, yPos + 10);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Primary Factor: ${riskAssessment.reason}`, margin + 10, yPos + 25);
      
      yPos += 60;
      
      // PAGE 2: DETAILED DISTRIBUTION ANALYSIS
      doc.addPage();
      yPos = 30;
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('TOKEN DISTRIBUTION ANALYSIS', margin, yPos);
      yPos += 20;
      
      // Distribution table with enhanced details
      const distributionData = Object.entries(distribution).map(([key, data]) => ({
        category: data.label,
        percentage: data.value,
        tokens: (totalSupply * data.value / 100),
        purpose: key === 'team' ? 'Development & Operations' :
                key === 'investors' ? 'Private Sale & Funding' :
                key === 'community' ? 'Rewards & Incentives' :
                key === 'liquidity' ? 'DEX Liquidity & Trading' :
                key === 'marketing' ? 'Growth & Partnerships' :
                'Strategic Reserve & Future Development'
      }));
      
      // Table headers
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPos, maxLineWidth, 15, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos, maxLineWidth, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('CATEGORY', margin + 5, yPos + 10);
      doc.text('ALLOCATION', margin + 60, yPos + 10);
      doc.text('TOKENS', margin + 95, yPos + 10);
      doc.text('PURPOSE', margin + 135, yPos + 10);
      
      yPos += 15;
      
      // Table rows
      distributionData.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPos, maxLineWidth, 15, 'F');
        }
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, yPos, maxLineWidth, 15);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(row.category, margin + 5, yPos + 10);
        doc.text(`${row.percentage}%`, margin + 60, yPos + 10);
        doc.text(row.tokens.toLocaleString(), margin + 95, yPos + 10);
        
        const purposeLines = wrapText(row.purpose, 45, 9);
        doc.text(purposeLines[0], margin + 135, yPos + 10);
        
        yPos += 15;
      });
      
      yPos += 20;
      
      // Distribution Analysis
      yPos = addNewPageIfNeeded(yPos, 100);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DISTRIBUTION INSIGHTS', margin, yPos);
      yPos += 15;
      
      const insights = [
        `Community Focus: ${communityRatio >= 0.3 ? 'Strong (30%+)' : communityRatio >= 0.2 ? 'Moderate (20-30%)' : 'Weak (<20%)'} - ${Math.round(communityRatio * 100)}% allocated`,
        `Liquidity Strength: ${liquidityRatio >= 0.15 ? 'Excellent (15%+)' : liquidityRatio >= 0.1 ? 'Good (10-15%)' : liquidityRatio >= 0.05 ? 'Adequate (5-10%)' : 'Insufficient (<5%)'} - ${Math.round(liquidityRatio * 100)}% allocated`,
        `Team Concentration: ${teamRatio <= 0.15 ? 'Conservative (≤15%)' : teamRatio <= 0.25 ? 'Standard (15-25%)' : 'High (>25%)'} - ${Math.round(teamRatio * 100)}% allocated`,
        `Reserve Management: ${reserveRatio <= 0.1 ? 'Minimal (≤10%)' : reserveRatio <= 0.2 ? 'Moderate (10-20%)' : 'Substantial (>20%)'} - ${Math.round(reserveRatio * 100)}% allocated`
      ];
      
      insights.forEach(insight => {
        const lines = wrapText(insight, maxLineWidth - 20, 11);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        lines.forEach(line => {
          doc.text(`• ${line}`, margin + 10, yPos);
          yPos += 7;
        });
        yPos += 3;
      });
      
      // PAGE 3: MARKET SCENARIOS & PROJECTIONS
      doc.addPage();
      yPos = 30;
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('MARKET SCENARIOS & VALUATIONS', margin, yPos);
      yPos += 20;
      
      // Market cap scenarios table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('VALUATION PROJECTIONS', margin, yPos);
      yPos += 15;
      
      // Scenario table headers
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPos, maxLineWidth, 15, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, yPos, maxLineWidth, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('SCENARIO', margin + 5, yPos + 10);
      doc.text('TOKEN PRICE', margin + 50, yPos + 10);
      doc.text('MARKET CAP', margin + 90, yPos + 10);
      doc.text('LIQUIDITY VALUE', margin + 130, yPos + 10);
      
      yPos += 15;
      
      marketScenarios.forEach((scenario, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPos, maxLineWidth, 15, 'F');
        }
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, yPos, maxLineWidth, 15);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(scenario.name, margin + 5, yPos + 10);
        doc.text(`$${scenario.pricePerToken}`, margin + 50, yPos + 10);
        doc.text(`$${scenario.marketCap.toLocaleString()}`, margin + 90, yPos + 10);
        doc.text(`$${scenario.liquidityValue.toLocaleString()}`, margin + 130, yPos + 10);
        
        yPos += 15;
      });
      
      yPos += 25;
      
      // Economic Analysis
      yPos = addNewPageIfNeeded(yPos, 80);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ECONOMIC ANALYSIS', margin, yPos);
      yPos += 15;
      
      const economicFactors = [
        `Supply Model: ${totalSupply >= 1000000000 ? 'High Supply (1B+)' : totalSupply >= 100000000 ? 'Medium Supply (100M-1B)' : 'Low Supply (<100M)'} - ${totalSupply.toLocaleString()} total tokens`,
        `Inflation Risk: ${reserveRatio > 0.2 ? 'High' : reserveRatio > 0.1 ? 'Moderate' : 'Low'} - Reserve allocation could impact circulating supply`,
        `Liquidity Depth: ${liquidityRatio >= 0.15 ? 'Deep' : liquidityRatio >= 0.1 ? 'Adequate' : 'Shallow'} - ${Math.round((totalSupply * liquidityRatio)).toLocaleString()} tokens in liquidity`,
        `Decentralization: ${teamRatio + distribution.investors.value/100 <= 0.3 ? 'High' : teamRatio + distribution.investors.value/100 <= 0.5 ? 'Moderate' : 'Low'} - ${Math.round((teamRatio + distribution.investors.value/100) * 100)}% centralized ownership`
      ];
      
      economicFactors.forEach(factor => {
        const lines = wrapText(factor, maxLineWidth - 20, 11);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        lines.forEach(line => {
          doc.text(`• ${line}`, margin + 10, yPos);
          yPos += 7;
        });
        yPos += 3;
      });
      
      // PAGE 4: RECOMMENDATIONS & ACTION ITEMS
      doc.addPage();
      yPos = 30;
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('RECOMMENDATIONS & NEXT STEPS', margin, yPos);
      yPos += 25;
      
      // Enhanced Health Analysis
      if (healthAnalysis.strengths.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94);
        doc.text('STRENGTHS', margin, yPos);
        yPos += 15;
        
        healthAnalysis.strengths.forEach(strength => {
          const lines = wrapText(strength, maxLineWidth - 30, 11);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          lines.forEach(line => {
            doc.text(`✓ ${line}`, margin + 10, yPos);
            yPos += 7;
          });
          yPos += 3;
        });
        yPos += 10;
      }
      
      if (healthAnalysis.issues.length > 0) {
        yPos = addNewPageIfNeeded(yPos, 40);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('AREAS FOR IMPROVEMENT', margin, yPos);
        yPos += 15;
        
        healthAnalysis.issues.forEach(issue => {
          const lines = wrapText(issue, maxLineWidth - 30, 11);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          lines.forEach(line => {
            doc.text(`⚠ ${line}`, margin + 10, yPos);
            yPos += 7;
          });
          yPos += 3;
        });
        yPos += 10;
      }
      
      if (healthAnalysis.recommendations.length > 0) {
        yPos = addNewPageIfNeeded(yPos, 40);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('STRATEGIC RECOMMENDATIONS', margin, yPos);
        yPos += 15;
        
        healthAnalysis.recommendations.forEach((rec, index) => {
          const lines = wrapText(rec, maxLineWidth - 30, 11);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          lines.forEach(line => {
            doc.text(`${index + 1}. ${line}`, margin + 10, yPos);
            yPos += 7;
          });
          yPos += 3;
        });
      }
      
      // Implementation Timeline
      yPos = addNewPageIfNeeded(yPos, 80);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('IMPLEMENTATION TIMELINE', margin, yPos);
      yPos += 15;
      
      const timeline = [
        'Phase 1 (0-30 days): Finalize tokenomics parameters and smart contract development',
        'Phase 2 (30-60 days): Community building and initial liquidity preparation',
        'Phase 3 (60-90 days): Token launch and initial distribution execution',
        'Phase 4 (90+ days): Monitor metrics and adjust community incentives as needed'
      ];
      
      timeline.forEach(phase => {
        const lines = wrapText(phase, maxLineWidth - 20, 11);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        lines.forEach(line => {
          doc.text(`• ${line}`, margin + 10, yPos);
          yPos += 7;
        });
        yPos += 5;
      });
      
      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Professional footer
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.line(0, pageHeight - 25, pageWidth, pageHeight - 25);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by Snarbles Tokenomics Designer', margin, pageHeight - 15);
        doc.text(`Professional Token Economy Analysis • snarbles.xyz`, margin, pageHeight - 8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
        doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 8, { align: 'right' });
      }
      
      const fileName = projectName ? 
        `${projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-tokenomics-analysis.pdf` : 
        'comprehensive-tokenomics-analysis.pdf';
      
      doc.save(fileName);
      
      toast({
        title: "Comprehensive Report Generated! 📊",
        description: `Your detailed ${totalPages}-page tokenomics analysis has been downloaded as ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF. Please try again.",
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

  // Enhanced chart data for visualizations
  const chartData = Object.entries(distribution).map(([key, data]) => ({
    name: data.label,
    value: data.value,
    fill: data.color,
    tokens: Math.round((totalSupply * data.value) / 100)
  }));

  // Mobile-optimized components
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

  const HealthAnalysisPanel = () => (
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
      <CardContent className="space-y-4">
        {healthAnalysis.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-600 flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Strengths</span>
            </h4>
            <ul className="space-y-1">
              {healthAnalysis.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-4">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {healthAnalysis.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Issues</span>
            </h4>
            <ul className="space-y-1">
              {healthAnalysis.issues.map((issue, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-4">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {healthAnalysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Recommendations</span>
            </h4>
            <ul className="space-y-1">
              {healthAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-4">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthScoreIcon = (score: number) => {
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
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="relative container mx-auto px-4 py-8 sm:py-16">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-2 sm:mb-4">
              <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Tokenomics Designer
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Create balanced and sustainable token distributions with our interactive designer. 
              Get instant feedback and generate professional reports.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Project Information */}
        <Card className="glass-card border-0 bg-background/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Settings className="w-5 h-5" />
              <span>Project Information</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Add your project details to generate personalized reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="Enter your project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSupply" className="text-sm font-medium">Total Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="100000000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(Number(e.target.value))}
                  className="h-10 sm:h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-sm font-medium">Project Description</Label>
              <textarea
                id="projectDescription"
                className="w-full min-h-[80px] sm:min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe your project and its mission..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Mobile Optimized Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="allocation" className="text-xs sm:text-sm">Allocation</TabsTrigger>
            <TabsTrigger value="visualize" className="text-xs sm:text-sm">Visualize</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">Analysis</TabsTrigger>
          </TabsList>

          {/* Token Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <Card className="glass-card border-0 bg-background/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <PieChartIcon className="w-5 h-5" />
                    <span className="text-lg">Token Allocation</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-medium ${getHealthScoreColor(healthAnalysis.score)}`}>
                    {getHealthScoreIcon(healthAnalysis.score)}
                    <span className="ml-2">Health: {healthAnalysis.score}/100</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-sm">
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
                      <Label className="font-medium text-sm sm:text-base">{data.label}</Label>
                      <span className="text-sm font-semibold bg-muted px-2 py-1 rounded">{data.value}%</span>
                    </div>
                    <Slider
                      value={[data.value]}
                      onValueChange={(value) => updateDistribution(key as keyof DistributionMap, value[0])}
                      max={80}
                      step={1}
                      className="w-full touch-manipulation"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{allocationExplanations[key as keyof DistributionMap]?.recommendation}</span>
                      <span>{((totalSupply * data.value) / 100).toLocaleString()} tokens</span>
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
            <HealthAnalysisPanel />
          </TabsContent>
        </Tabs>

        {/* Enhanced Actions */}
        <Card className="glass-card border-0 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
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
              className="border-border hover:bg-muted h-12 sm:h-auto"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button 
              onClick={saveConfiguration}
              variant="outline" 
              className={`border-border hover:bg-muted h-12 sm:h-auto ${savedSuccess ? 'bg-green-50 border-green-200' : ''}`}
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
              className="border-border hover:bg-muted h-12 sm:h-auto"
            >
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">Share</span>
            </Button>
            <Button 
              onClick={() => setActiveTab('visualize')}
              variant="outline"
              className="border-border hover:bg-muted h-12 sm:h-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Preview</span>
              <span className="sm:hidden">View</span>
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced CTA */}
        <div className="text-center space-y-6 py-8 sm:py-12">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold">Ready to Create Your Token?</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Your tokenomics are configured. Apply this distribution to create your token 
              or explore our token creation tools.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <Button 
              onClick={applyToToken}
              className="bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold w-full sm:w-auto h-12 sm:h-auto"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Create Token Now
            </Button>
            <Link href="/create" className="w-full sm:w-auto">
              <Button variant="outline" className="border-border hover:bg-muted text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full h-12 sm:h-auto">
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
