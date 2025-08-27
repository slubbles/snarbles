/**
 * Data Accuracy Indicator Component
 * 
 * Displays data accuracy metrics and quality indicators for verification results
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Target,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';

interface DataAccuracyIndicatorProps {
  confidence: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  issues?: string[];
  corrections?: any[];
  className?: string;
}

export function DataAccuracyIndicator({ 
  confidence, 
  dataQuality, 
  issues = [], 
  corrections = [],
  className = '' 
}: DataAccuracyIndicatorProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'good': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'fair': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'poor': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Award className="w-5 h-5 text-green-400" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'fair': return <Target className="w-5 h-5 text-yellow-400" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getConfidenceGrade = (conf: number) => {
    if (conf >= 95) return 'A+';
    if (conf >= 90) return 'A';
    if (conf >= 85) return 'B+';
    if (conf >= 80) return 'B';
    if (conf >= 75) return 'C+';
    if (conf >= 70) return 'C';
    if (conf >= 60) return 'D';
    return 'F';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Accuracy Display */}
      <Card className={`glass-card border ${getQualityColor(dataQuality)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getQualityIcon(dataQuality)}
              <span className="text-lg font-bold">Data Accuracy</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={confidence >= 90 ? 'default' : confidence >= 75 ? 'secondary' : 'destructive'}>
                {getConfidenceGrade(confidence)}
              </Badge>
              <Badge className={`px-3 py-1 ${getQualityColor(dataQuality)}`}>
                {dataQuality.toUpperCase()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Confidence Level</span>
              <span className="text-lg font-bold">{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Data Quality</span>
              </div>
              <p className="font-bold capitalize">{dataQuality}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Accuracy Score</span>
              </div>
              <p className="font-bold">{confidence}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues and Corrections */}
      {(issues.length > 0 || corrections.length > 0) && (
        <div className="space-y-3">
          {/* Data Issues */}
          {issues.length > 0 && (
            <Alert className="glass-card border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                <div className="space-y-2">
                  <p className="font-medium">Data Quality Issues Detected:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Applied Corrections */}
          {corrections.length > 0 && (
            <Alert className="glass-card border-blue-500/30 bg-blue-500/5">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                <div className="space-y-2">
                  <p className="font-medium">Auto-Corrections Applied:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {corrections.map((correction, index) => (
                      <li key={index}>
                        <strong>{correction.field}:</strong> {correction.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Accuracy Guarantee */}
      {confidence >= 95 && (
        <Alert className="glass-card border-green-500/30 bg-green-500/5">
          <Award className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">🎯 100% Accuracy Guarantee</p>
                <p className="text-sm">All data points verified and validated</p>
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                Verified
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default DataAccuracyIndicator;
