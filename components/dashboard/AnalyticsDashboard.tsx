import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Target, 
  Lightbulb, 
  Sparkles, 
  Clock, 
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Download,
  Upload,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  aiMetadataService,
  type AIMetadataRequest,
  type AIMetadataResponse,
  type MetadataAnalytics,
  type BatchOperationRequest
} from '@/lib/ai-metadata-service';
import { metadataService } from '@/lib/metadata-service';

interface AnalyticsDashboardProps {
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
  tokens?: Array<{
    tokenId: string;
    network: 'algorand' | 'solana';
    metadata: any;
  }>;
}

export function AnalyticsDashboard({ walletAddress, signTransaction, tokens = [] }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = React.useState('analytics');
  const [loading, setLoading] = React.useState(false);
  const [selectedTokens, setSelectedTokens] = React.useState<string[]>([]);
  
  // AI Metadata Generation State
  const [aiRequest, setAiRequest] = React.useState<Partial<AIMetadataRequest>>({
    network: 'algorand'
  });
  const [aiResponse, setAiResponse] = React.useState<AIMetadataResponse | null>(null);
  
  // Analytics State
  const [analytics, setAnalytics] = React.useState<MetadataAnalytics[]>([]);
  const [overallStats, setOverallStats] = React.useState({
    totalTokens: 0,
    avgMetadataScore: 0,
    avgSeoScore: 0,
    avgEngagementScore: 0,
    totalRecommendations: 0
  });

  React.useEffect(() => {
    if (tokens.length > 0) {
      calculateOverallStats();
    }
  }, [tokens]);

  const calculateOverallStats = async () => {
    if (tokens.length === 0) return;

    try {
      setLoading(true);
      const analyticsResults = await Promise.all(
        tokens.slice(0, 10).map(token => // Limit to first 10 for performance
          aiMetadataService.analyzeMetadata(token.tokenId, token.network, token.metadata)
        )
      );

      setAnalytics(analyticsResults);

      const stats = analyticsResults.reduce((acc, result) => ({
        totalTokens: acc.totalTokens + 1,
        avgMetadataScore: acc.avgMetadataScore + result.analytics.metadataScore,
        avgSeoScore: acc.avgSeoScore + result.analytics.seoScore,
        avgEngagementScore: acc.avgEngagementScore + result.analytics.engagementPotential,
        totalRecommendations: acc.totalRecommendations + result.analytics.recommendations.length
      }), {
        totalTokens: 0,
        avgMetadataScore: 0,
        avgSeoScore: 0,
        avgEngagementScore: 0,
        totalRecommendations: 0
      });

      setOverallStats({
        ...stats,
        avgMetadataScore: stats.avgMetadataScore / stats.totalTokens,
        avgSeoScore: stats.avgSeoScore / stats.totalTokens,
        avgEngagementScore: stats.avgEngagementScore / stats.totalTokens
      });

    } catch (error) {
      console.error('❌ Failed to calculate stats:', error);
      toast.error('Failed to analyze token metadata');
    } finally {
      setLoading(false);
    }
  };

  const generateAIMetadata = async () => {
    if (!aiRequest.tokenName && !aiRequest.existingDescription) {
      toast.error('Please provide at least a token name or description');
      return;
    }

    try {
      setLoading(true);
      const response = await aiMetadataService.generateMetadataSuggestions(aiRequest as AIMetadataRequest);
      setAiResponse(response);
      
      if (response.success) {
        toast.success('AI suggestions generated successfully!');
      } else {
        toast.warning('AI service unavailable, showing fallback suggestions');
      }
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      toast.error('Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const executeBatchOperation = async (operation: 'analyze' | 'optimize') => {
    if (selectedTokens.length === 0) {
      toast.error('Please select tokens to process');
      return;
    }

    try {
      setLoading(true);
      const batchRequest: BatchOperationRequest = {
        tokens: selectedTokens.map(tokenId => {
          const token = tokens.find(t => t.tokenId === tokenId);
          return {
            tokenId,
            network: token?.network || 'algorand',
            operation: 'analyze',
            params: { metadata: token?.metadata }
          };
        }),
        walletAddress,
        signTransaction
      };

      const result = await aiMetadataService.executeBatchOperation(batchRequest);
      
      if (result.success) {
        toast.success(`Batch ${operation} completed successfully!`);
        await calculateOverallStats(); // Refresh analytics
      } else {
        toast.error(`Batch ${operation} failed`);
      }
    } catch (error) {
      console.error(`❌ Batch ${operation} failed:`, error);
      toast.error(`Failed to execute batch ${operation}`);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 0.6) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive" className="bg-red-100 text-red-800">Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Metadata Analytics & AI
          </h2>
          <p className="text-gray-600">Advanced analytics and AI-powered metadata optimization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={calculateOverallStats} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold">{overallStats.totalTokens}</p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Metadata Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallStats.avgMetadataScore)}`}>
                  {(overallStats.avgMetadataScore * 100).toFixed(0)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg SEO Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallStats.avgSeoScore)}`}>
                  {(overallStats.avgSeoScore * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recommendations</p>
                <p className="text-2xl font-bold">{overallStats.totalRecommendations}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ai-generator" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="batch-ops" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Batch Operations
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Token Analytics
              </CardTitle>
              <CardDescription>
                Detailed analysis of your token metadata quality and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No analytics data available</p>
                  <Button 
                    onClick={calculateOverallStats} 
                    disabled={loading || tokens.length === 0}
                    className="mt-4"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Generate Analytics
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.map((item, index) => (
                    <Card key={item.tokenId} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.tokenId}</h4>
                              <Badge variant="outline">{item.network}</Badge>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Metadata Score</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={item.analytics.metadataScore * 100} className="h-2 flex-1" />
                                  <span className={`font-semibold ${getScoreColor(item.analytics.metadataScore)}`}>
                                    {(item.analytics.metadataScore * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-600">SEO Score</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={item.analytics.seoScore * 100} className="h-2 flex-1" />
                                  <span className={`font-semibold ${getScoreColor(item.analytics.seoScore)}`}>
                                    {(item.analytics.seoScore * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-600">Engagement</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={item.analytics.engagementPotential * 100} className="h-2 flex-1" />
                                  <span className={`font-semibold ${getScoreColor(item.analytics.engagementPotential)}`}>
                                    {(item.analytics.engagementPotential * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-600">Last Update</p>
                                <p className="font-semibold">
                                  {item.analytics.lastUpdateDays === 999 ? 'Never' : `${item.analytics.lastUpdateDays}d ago`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="lg:w-1/3">
                            <p className="text-sm text-gray-600 mb-2">Recommendations:</p>
                            <div className="space-y-1">
                              {item.analytics.recommendations.slice(0, 2).map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <Lightbulb className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="ai-generator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Metadata Generator
                </CardTitle>
                <CardDescription>
                  Generate intelligent metadata suggestions using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tokenName">Token Name</Label>
                    <Input
                      id="tokenName"
                      value={aiRequest.tokenName || ''}
                      onChange={(e) => setAiRequest(prev => ({ ...prev, tokenName: e.target.value }))}
                      placeholder="Enter token name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="network">Network</Label>
                    <Select 
                      value={aiRequest.network} 
                      onValueChange={(value) => setAiRequest(prev => ({ ...prev, network: value as 'algorand' | 'solana' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="algorand">Algorand</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={aiRequest.category || ''}
                    onChange={(e) => setAiRequest(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Art, Gaming, Music, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Existing Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={aiRequest.existingDescription || ''}
                    onChange={(e) => setAiRequest(prev => ({ ...prev, existingDescription: e.target.value }))}
                    placeholder="Current description to improve..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Input
                      id="projectType"
                      value={aiRequest.projectType || ''}
                      onChange={(e) => setAiRequest(prev => ({ ...prev, projectType: e.target.value }))}
                      placeholder="Collectible, Utility, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      value={aiRequest.targetAudience || ''}
                      onChange={(e) => setAiRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="Collectors, Gamers, etc."
                    />
                  </div>
                </div>

                <Button onClick={generateAIMetadata} disabled={loading} className="w-full">
                  <Sparkles className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Generate AI Suggestions
                </Button>
              </CardContent>
            </Card>

            {/* AI Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Suggestions
                </CardTitle>
                <CardDescription>
                  {aiResponse ? `Confidence: ${(aiResponse.confidence * 100).toFixed(0)}%` : 'Generate suggestions to see results'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!aiResponse ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">AI suggestions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <Label className="text-sm font-semibold">Optimized Description</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                        {aiResponse.suggestions.description}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label className="text-sm font-semibold">Suggested Tags</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {aiResponse.suggestions.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Attributes */}
                    <div>
                      <Label className="text-sm font-semibold">Attributes</Label>
                      <div className="mt-1 space-y-1">
                        {aiResponse.suggestions.attributes.map((attr, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">{attr.trait_type}</span>
                            <span>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Marketing Copy */}
                    <div>
                      <Label className="text-sm font-semibold">Marketing Copy</Label>
                      <div className="mt-1 space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Short:</span>
                          <p className="text-gray-700">{aiResponse.suggestions.marketingCopy.short}</p>
                        </div>
                        <div>
                          <span className="font-medium">Social Media:</span>
                          <p className="text-gray-700">{aiResponse.suggestions.socialMediaText.twitter}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="border-t pt-3">
                      <Label className="text-sm font-semibold">AI Reasoning</Label>
                      <p className="text-xs text-gray-600 mt-1">{aiResponse.reasoning}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Operations Tab */}
        <TabsContent value="batch-ops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Batch Operations
              </CardTitle>
              <CardDescription>
                Process multiple tokens simultaneously with AI-powered operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Token Selection */}
              <div>
                <Label className="text-sm font-semibold">Select Tokens</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                  {tokens.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No tokens available</p>
                  ) : (
                    tokens.slice(0, 20).map((token) => (
                      <label key={token.tokenId} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTokens.includes(token.tokenId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTokens(prev => [...prev, token.tokenId]);
                            } else {
                              setSelectedTokens(prev => prev.filter(id => id !== token.tokenId));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="flex-1 truncate">{token.tokenId}</span>
                        <Badge variant="outline" className="text-xs">{token.network}</Badge>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedTokens.length} of {Math.min(tokens.length, 20)} tokens selected
                </p>
              </div>

              {/* Batch Operations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => executeBatchOperation('analyze')}
                  disabled={loading || selectedTokens.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Batch Analyze
                </Button>

                <Button
                  onClick={() => executeBatchOperation('optimize')}
                  disabled={loading || selectedTokens.length === 0}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Batch Optimize
                </Button>
              </div>

              {/* Batch Progress Info */}
              {selectedTokens.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Batch Operation Info</p>
                      <p className="text-blue-700">
                        {selectedTokens.length} tokens selected • Estimated time: {selectedTokens.length * 2}s
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
