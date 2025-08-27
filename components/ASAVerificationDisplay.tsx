/**
 * Enhanced ASA Verification Result Display Components
 * 
 * These components provide a specialized display for Algorand Standard Asset verification results
 * with ASA-specific information, security analysis, and management capabilities.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Crown,
  Snowflake,
  RotateCcw,
  Lock,
  Unlock,
  Users,
  Globe,
  ExternalLink,
  Copy,
  Share2,
  FileText,
  Activity,
  TrendingUp,
  Info,
  Zap,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import { ASAVerificationResult } from '@/lib/algorand-asa-verification';

interface ASAVerificationDisplayProps {
  result: ASAVerificationResult;
  onCopy?: (text: string, label: string) => void;
  onShare?: () => void;
  onOpenExplorer?: () => void;
}

export function ASAVerificationDisplay({ 
  result, 
  onCopy, 
  onShare, 
  onOpenExplorer 
}: ASAVerificationDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'caution': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'risky': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'danger': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'caution': return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case 'risky': return <AlertTriangle className="w-8 h-8 text-orange-400" />;
      case 'danger': return <AlertCircle className="w-8 h-8 text-red-400" />;
      default: return <Shield className="w-8 h-8 text-gray-400" />;
    }
  };

  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'safe': return 'default';
      case 'caution': return 'secondary';
      case 'risky': return 'outline';
      case 'danger': return 'destructive';
      default: return 'outline';
    }
  };

  if (!result.exists) {
    return (
      <Card className="glass-card border-red-500/30 bg-red-500/5">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">ASA Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Asset ID {result.assetId} was not found on {result.network}
          </p>
          {result.networkInfo.crossNetworkDetails && (
            <div className="text-sm text-muted-foreground">
              <p>Checked networks:</p>
              <p>• Mainnet: {result.networkInfo.crossNetworkDetails.foundOnMainnet ? '✓ Found' : '✗ Not found'}</p>
              <p>• Testnet: {result.networkInfo.crossNetworkDetails.foundOnTestnet ? '✓ Found' : '✗ Not found'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className={`glass-card border-2 ${getStatusColor(result.status)}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getStatusIcon(result.status)}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {result.basicInfo.name}
                </h2>
                <p className="text-muted-foreground">
                  {result.basicInfo.unitName} • Asset ID: {result.assetId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={getBadgeVariant(result.status)} className="px-4 py-2 text-lg">
                {result.status.toUpperCase()}
              </Badge>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{result.score}/100</p>
                <p className="text-sm text-muted-foreground">Security Score</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Security Assessment</span>
              <span className="text-foreground font-medium">{result.score}%</span>
            </div>
            <Progress value={result.score} className="h-3" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={onOpenExplorer} 
              variant="outline" 
              className="border-border hover:bg-muted"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Explorer
            </Button>
            <Button 
              onClick={() => onCopy?.(result.assetId.toString(), 'Asset ID')} 
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy ID
            </Button>
            <Button 
              onClick={onShare} 
              variant="outline"
              className="border-border hover:bg-muted"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Information */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Asset Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-bold text-foreground">{result.basicInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Symbol</p>
              <p className="font-bold text-foreground">{result.basicInfo.unitName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Supply</p>
              <p className="font-bold text-foreground">
                {result.basicInfo.totalSupply.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Decimals</p>
              <p className="font-bold text-foreground">{result.basicInfo.decimals}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creator</p>
              <p className="font-mono text-sm text-foreground break-all">
                {result.basicInfo.creator}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Management Roles */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Management Roles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ASAManagementRoles roles={result.roles} />
          </CardContent>
        </Card>

        {/* Distribution Analysis */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span>Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ASADistributionInfo distribution={result.distribution} />
          </CardContent>
        </Card>
      </div>

      {/* Security Analysis */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Security Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ASASecurityAnalysis security={result.security} />
        </CardContent>
      </Card>

      {/* Standards Compliance */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Standards Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ASAStandardsCompliance standards={result.standards} />
        </CardContent>
      </Card>

      {/* Warnings */}
      {result.security.warnings.length > 0 && (
        <Alert className="glass-card border-red-500/30 bg-red-500/5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-400">
            <strong>Security Warnings:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {result.security.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ASAManagementRoles({ roles }: { roles: ASAVerificationResult['roles'] }) {
  return (
    <div className="space-y-3">
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-3 rounded-lg border transition-all ${
                roles.isImmutable 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              }`}>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {roles.isImmutable ? 'Immutable' : 'Mutable'}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roles.isImmutable ? 'Cannot be modified by anyone' : 'Can be modified by manager'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-3 rounded-lg border transition-all ${
                roles.canBeMinted 
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {roles.canBeMinted ? 'Mintable' : 'Fixed Supply'}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roles.canBeMinted ? 'Manager can create more tokens' : 'Supply is fixed forever'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-3 rounded-lg border transition-all ${
                roles.canBeFrozen 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                <div className="flex items-center space-x-2">
                  <Snowflake className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {roles.canBeFrozen ? 'Freezable' : 'No Freeze'}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roles.canBeFrozen ? 'Transfers can be frozen' : 'Cannot be frozen'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-3 rounded-lg border transition-all ${
                roles.canBeBurned 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {roles.canBeBurned ? 'Clawback' : 'No Clawback'}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{roles.canBeBurned ? 'Tokens can be taken back' : 'No clawback capability'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}

function ASADistributionInfo({ distribution }: { distribution: ASAVerificationResult['distribution'] }) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'centralized': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Distribution Health</p>
        <p className={`font-bold capitalize ${getHealthColor(distribution.distributionHealth)}`}>
          {distribution.distributionHealth}
        </p>
      </div>
      
      {distribution.holderCount !== undefined && (
        <div>
          <p className="text-sm text-muted-foreground">Holders</p>
          <p className="font-bold text-foreground">{distribution.holderCount.toLocaleString()}</p>
        </div>
      )}
      
      {distribution.topHolderPercentage !== undefined && (
        <div>
          <p className="text-sm text-muted-foreground">Top Holder</p>
          <p className="font-bold text-foreground">{distribution.topHolderPercentage.toFixed(1)}%</p>
        </div>
      )}
      
      {distribution.circulatingSupply !== undefined && (
        <div>
          <p className="text-sm text-muted-foreground">Circulating Supply</p>
          <p className="font-bold text-foreground">{distribution.circulatingSupply.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function ASASecurityAnalysis({ security }: { security: ASAVerificationResult['security'] }) {
  return (
    <div className="space-y-6">
      {/* Decentralization Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Decentralization Score</span>
          <span className="font-bold text-foreground">{security.decentralizationScore}/100</span>
        </div>
        <Progress value={security.decentralizationScore} className="h-2" />
      </div>

      {/* Security Features */}
      {security.securityFeatures.length > 0 && (
        <div>
          <h4 className="font-medium text-green-400 mb-3 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Security Features</span>
          </h4>
          <ul className="space-y-2">
            {security.securityFeatures.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {security.riskFactors.length > 0 && (
        <div>
          <h4 className="font-medium text-yellow-400 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Factors</span>
          </h4>
          <ul className="space-y-2">
            {security.riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ASAStandardsCompliance({ standards }: { standards: ASAVerificationResult['standards'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`p-4 rounded-lg border ${
        standards.arc3Compliant 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {standards.arc3Compliant ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-medium">ARC-3 Standard</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {standards.arc3Compliant ? 'Compliant' : 'Not compliant'} with ARC-3 metadata standard
        </p>
      </div>

      <div className={`p-4 rounded-lg border ${
        standards.arc19Compliant 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {standards.arc19Compliant ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-medium">ARC-19 Standard</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {standards.arc19Compliant ? 'Compliant' : 'Not compliant'} with ARC-19 metadata standard
        </p>
      </div>

      <div className={`p-4 rounded-lg border ${
        standards.metadataAccessible 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {standards.metadataAccessible ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-medium">Metadata Access</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Metadata URL is {standards.metadataAccessible ? 'accessible' : 'not accessible'}
        </p>
      </div>

      <div className={`p-4 rounded-lg border ${
        standards.metadataValid 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {standards.metadataValid ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className="font-medium">Metadata Validity</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Metadata format is {standards.metadataValid ? 'valid JSON' : 'invalid or missing'}
        </p>
      </div>
    </div>
  );
}

export default ASAVerificationDisplay;
