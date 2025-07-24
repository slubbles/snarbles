import { metadataService } from './metadata-service';

export interface AIMetadataRequest {
  tokenName?: string;
  existingDescription?: string;
  category?: string;
  network: 'algorand' | 'solana';
  imageUrl?: string;
  projectType?: string;
  targetAudience?: string;
  useCase?: string;
}

export interface AIMetadataResponse {
  success: boolean;
  suggestions: {
    description: string;
    tags: string[];
    category: string;
    attributes: Array<{
      trait_type: string;
      value: string;
      rarity_score?: number;
    }>;
    marketingCopy: {
      short: string;
      medium: string;
      long: string;
    };
    seoKeywords: string[];
    socialMediaText: {
      twitter: string;
      discord: string;
    };
  };
  confidence: number;
  reasoning: string;
  error?: string;
}

export interface MetadataAnalytics {
  tokenId: string;
  network: 'algorand' | 'solana';
  analytics: {
    updateFrequency: number;
    lastUpdateDays: number;
    authorityChanges: number;
    metadataScore: number;
    completenessScore: number;
    seoScore: number;
    engagementPotential: number;
    recommendations: string[];
  };
}

export interface BatchOperationRequest {
  tokens: Array<{
    tokenId: string;
    network: 'algorand' | 'solana';
    operation: 'update_metadata' | 'transfer_authority' | 'analyze';
    params: any;
  }>;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
}

export interface BatchOperationResult {
  success: boolean;
  results: Array<{
    tokenId: string;
    success: boolean;
    transactionHash?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalCost: number;
    estimatedTime: number;
  };
}

/**
 * AI-powered metadata service for intelligent content generation
 */
export class AIMetadataService {
  private static instance: AIMetadataService;
  private apiEndpoint = process.env.NEXT_PUBLIC_AI_API_ENDPOINT || 'https://api.openai.com/v1';
  private apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  static getInstance(): AIMetadataService {
    if (!AIMetadataService.instance) {
      AIMetadataService.instance = new AIMetadataService();
    }
    return AIMetadataService.instance;
  }

  /**
   * Generate AI-powered metadata suggestions
   */
  async generateMetadataSuggestions(request: AIMetadataRequest): Promise<AIMetadataResponse> {
    try {
      console.log('🤖 Generating AI metadata suggestions...');

      // For demo purposes, we'll create intelligent mock responses
      // In production, this would integrate with OpenAI or similar AI service
      const suggestions = await this.generateMockAISuggestions(request);

      return {
        success: true,
        suggestions,
        confidence: 0.85,
        reasoning: this.generateReasoning(request, suggestions)
      };

    } catch (error) {
      console.error('❌ AI metadata generation failed:', error);
      return {
        success: false,
        suggestions: this.getFallbackSuggestions(request),
        confidence: 0.3,
        reasoning: 'Using fallback suggestions due to AI service unavailability',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze existing metadata and provide improvement suggestions
   */
  async analyzeMetadata(tokenId: string, network: 'algorand' | 'solana', metadata: any): Promise<MetadataAnalytics> {
    try {
      console.log(`📊 Analyzing metadata for token ${tokenId}...`);

      // Get authority info and history for comprehensive analysis
      const authorityInfo = await metadataService.getAuthorityInfo(tokenId, network);
      const history = await metadataService.getMetadataHistory(tokenId, network);

      const analytics = this.calculateMetadataScores(metadata, authorityInfo.data, history.data || []);

      return {
        tokenId,
        network,
        analytics
      };

    } catch (error) {
      console.error('❌ Metadata analysis failed:', error);
      return {
        tokenId,
        network,
        analytics: {
          updateFrequency: 0,
          lastUpdateDays: 999,
          authorityChanges: 0,
          metadataScore: 0.3,
          completenessScore: 0.2,
          seoScore: 0.1,
          engagementPotential: 0.2,
          recommendations: ['Unable to analyze metadata due to errors']
        }
      };
    }
  }

  /**
   * Batch operations for multiple tokens
   */
  async executeBatchOperation(request: BatchOperationRequest): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let totalCost = 0;
    let successful = 0;
    let failed = 0;

    console.log(`🔄 Executing batch operation on ${request.tokens.length} tokens...`);

    for (const token of request.tokens) {
      try {
        let result;
        
        switch (token.operation) {
          case 'update_metadata':
            result = await metadataService.updateMetadata({
              tokenId: token.tokenId,
              network: token.network,
              metadata: token.params.metadata,
              walletAddress: request.walletAddress,
              signTransaction: request.signTransaction
            });
            break;
            
          case 'transfer_authority':
            result = await metadataService.updateAuthority({
              tokenId: token.tokenId,
              network: token.network,
              operation: 'transfer',
              targetAddress: token.params.targetAddress,
              walletAddress: request.walletAddress,
              signTransaction: request.signTransaction
            });
            break;
            
          case 'analyze':
            const analysis = await this.analyzeMetadata(token.tokenId, token.network, token.params.metadata);
            result = {
              success: true,
              data: analysis
            };
            break;
            
          default:
            throw new Error(`Unsupported operation: ${token.operation}`);
        }

        if (result.success) {
          successful++;
          results.push({
            tokenId: token.tokenId,
            success: true,
            transactionHash: result.transactionHash
          });
          
          // Estimate cost
          const costEstimate = await metadataService.estimateTransactionCost(
            token.operation === 'update_metadata' ? 'update_metadata' : 'transfer_authority',
            token.network
          );
          if (costEstimate.success && costEstimate.cost) {
            totalCost += costEstimate.cost;
          }
        } else {
          throw new Error(result.error || 'Operation failed');
        }

      } catch (error) {
        failed++;
        results.push({
          tokenId: token.tokenId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: failed === 0,
      results,
      summary: {
        total: request.tokens.length,
        successful,
        failed,
        totalCost,
        estimatedTime: request.tokens.length * 2 // 2 seconds per operation estimate
      }
    };
  }

  /**
   * Generate SEO-optimized metadata
   */
  async optimizeForSEO(metadata: any, targetKeywords: string[]): Promise<{
    optimizedMetadata: any;
    seoScore: number;
    improvements: string[];
  }> {
    const improvements: string[] = [];
    const optimizedMetadata = { ...metadata };

    // Optimize title
    if (!metadata.name || metadata.name.length < 3) {
      improvements.push('Title should be at least 3 characters long');
    }
    if (metadata.name && metadata.name.length > 32) {
      improvements.push('Title should be 32 characters or less for better display');
      optimizedMetadata.name = metadata.name.substring(0, 32);
    }

    // Optimize description
    if (!metadata.description || metadata.description.length < 50) {
      improvements.push('Description should be at least 50 characters for better SEO');
    }
    if (metadata.description && metadata.description.length > 160) {
      improvements.push('Description should be 160 characters or less for better snippet display');
    }

    // Add keywords to description if missing
    if (targetKeywords.length > 0) {
      const descriptionLower = (metadata.description || '').toLowerCase();
      const missingKeywords = targetKeywords.filter(keyword => 
        !descriptionLower.includes(keyword.toLowerCase())
      );
      
      if (missingKeywords.length > 0) {
        improvements.push(`Consider adding these keywords: ${missingKeywords.join(', ')}`);
      }
    }

    // Calculate SEO score
    const seoScore = this.calculateSEOScore(optimizedMetadata, targetKeywords);

    return {
      optimizedMetadata,
      seoScore,
      improvements
    };
  }

  /**
   * Generate market trend analysis
   */
  async getMarketTrends(category: string, network: 'algorand' | 'solana'): Promise<{
    trendingTags: string[];
    popularAttributes: string[];
    priceRanges: { min: number; max: number; avg: number };
    recommendedMetadata: any;
  }> {
    // Mock market trends data - in production, this would query real market data
    const mockTrends = {
      trendingTags: ['AI', 'Gaming', 'Utility', 'Rare', 'Limited Edition'],
      popularAttributes: ['Rarity', 'Power Level', 'Edition', 'Creator', 'Series'],
      priceRanges: { min: 0.1, max: 100, avg: 5.5 },
      recommendedMetadata: {
        attributes: [
          { trait_type: 'Rarity', value: 'Uncommon' },
          { trait_type: 'Edition', value: 'First Edition' }
        ],
        properties: {
          category: category,
          tags: ['trending', 'popular', category.toLowerCase()]
        }
      }
    };

    return mockTrends;
  }

  // Private helper methods

  private async generateMockAISuggestions(request: AIMetadataRequest): Promise<AIMetadataResponse['suggestions']> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const tokenName = request.tokenName || 'Untitled Token';
    const category = request.category || 'Art';
    
    return {
      description: `${tokenName} is a unique ${category.toLowerCase()} token that represents ${this.generateDescriptionContent(request)}. This digital asset combines innovative design with practical utility, making it perfect for collectors and enthusiasts alike.`,
      tags: this.generateSmartTags(request),
      category: this.suggestCategory(request),
      attributes: this.generateAttributes(request),
      marketingCopy: {
        short: `Own a piece of digital ${category.toLowerCase()} history with ${tokenName}`,
        medium: `${tokenName} brings together cutting-edge technology and artistic vision in the ${category.toLowerCase()} space. Don't miss this opportunity to own something truly special.`,
        long: `Introducing ${tokenName}, a revolutionary ${category.toLowerCase()} token that pushes the boundaries of what's possible in the digital asset space. With its unique characteristics and proven track record, this token represents the future of ${category.toLowerCase()} on ${request.network}.`
      },
      seoKeywords: ['NFT', category, tokenName, request.network, 'digital asset', 'blockchain', 'collectible'],
      socialMediaText: {
        twitter: `🚀 Check out ${tokenName} - the latest ${category.toLowerCase()} token on ${request.network}! #NFT #${category} #${request.network}`,
        discord: `Hey everyone! Just discovered ${tokenName} - an amazing ${category.toLowerCase()} token. The metadata and design look incredible! 🔥`
      }
    };
  }

  private generateDescriptionContent(request: AIMetadataRequest): string {
    const elements = [
      'cutting-edge blockchain technology',
      'artistic excellence',
      'innovative utility features',
      'community-driven value',
      'sustainable design principles'
    ];
    
    return elements[Math.floor(Math.random() * elements.length)];
  }

  private generateSmartTags(request: AIMetadataRequest): string[] {
    const baseTags = [request.category?.toLowerCase() || 'digital'];
    const networkTags = [request.network];
    const typeTags = request.projectType ? [request.projectType.toLowerCase()] : ['collectible'];
    const audienceTags = request.targetAudience ? [request.targetAudience.toLowerCase()] : [];
    
    return [...baseTags, ...networkTags, ...typeTags, ...audienceTags, 'unique', 'limited'];
  }

  private suggestCategory(request: AIMetadataRequest): string {
    if (request.category) return request.category;
    if (request.projectType?.toLowerCase().includes('game')) return 'Gaming';
    if (request.projectType?.toLowerCase().includes('art')) return 'Art';
    if (request.projectType?.toLowerCase().includes('music')) return 'Music';
    return 'Collectibles';
  }

  private generateAttributes(request: AIMetadataRequest): Array<{ trait_type: string; value: string; rarity_score?: number }> {
    const attributes = [
      { trait_type: 'Network', value: request.network === 'algorand' ? 'Algorand' : 'Solana', rarity_score: 0.5 },
      { trait_type: 'Generation', value: 'Gen 1', rarity_score: 0.2 },
      { trait_type: 'Status', value: 'Active', rarity_score: 0.8 }
    ];

    if (request.category) {
      attributes.push({ trait_type: 'Category', value: request.category, rarity_score: 0.6 });
    }

    return attributes;
  }

  private generateReasoning(request: AIMetadataRequest, suggestions: AIMetadataResponse['suggestions']): string {
    return `Based on the ${request.network} network characteristics and ${request.category || 'general'} category, I've optimized the metadata for discoverability and engagement. The description balances technical accuracy with market appeal, while the tags target relevant search terms. The suggested attributes follow current market trends for ${request.category || 'digital assets'}.`;
  }

  private getFallbackSuggestions(request: AIMetadataRequest): AIMetadataResponse['suggestions'] {
    return {
      description: `A unique ${request.category || 'digital'} token on the ${request.network} network.`,
      tags: [request.category?.toLowerCase() || 'digital', request.network, 'token'],
      category: request.category || 'Other',
      attributes: [
        { trait_type: 'Network', value: request.network === 'algorand' ? 'Algorand' : 'Solana' }
      ],
      marketingCopy: {
        short: `${request.tokenName || 'Digital Token'} on ${request.network}`,
        medium: `Discover ${request.tokenName || 'this unique token'} on the ${request.network} blockchain.`,
        long: `${request.tokenName || 'This digital asset'} represents innovation in the ${request.category || 'digital'} space on ${request.network}.`
      },
      seoKeywords: ['NFT', request.network, 'blockchain'],
      socialMediaText: {
        twitter: `Check out this ${request.category || 'digital'} token on ${request.network}!`,
        discord: `New token alert! 🚀`
      }
    };
  }

  private calculateMetadataScores(metadata: any, authorityInfo: any, history: any[]): MetadataAnalytics['analytics'] {
    const scores = {
      updateFrequency: history.length / Math.max(1, this.daysSinceCreation(history)),
      lastUpdateDays: history.length > 0 ? this.daysSince(history[0].timestamp) : 999,
      authorityChanges: history.filter(h => h.operation?.includes('authority')).length,
      metadataScore: this.calculateMetadataCompleteness(metadata),
      completenessScore: this.calculateCompletenessScore(metadata),
      seoScore: this.calculateSEOScore(metadata, []),
      engagementPotential: this.calculateEngagementPotential(metadata)
    };

    const recommendations = this.generateRecommendations(scores, metadata);

    return { ...scores, recommendations };
  }

  private calculateMetadataCompleteness(metadata: any): number {
    let score = 0;
    const maxScore = 10;

    if (metadata.name) score += 2;
    if (metadata.description && metadata.description.length > 20) score += 2;
    if (metadata.image) score += 2;
    if (metadata.external_url) score += 1;
    if (metadata.attributes && metadata.attributes.length > 0) score += 2;
    if (metadata.properties?.category) score += 1;

    return score / maxScore;
  }

  private calculateCompletenessScore(metadata: any): number {
    const fields = ['name', 'description', 'image', 'external_url', 'attributes', 'properties'];
    const completed = fields.filter(field => {
      if (field === 'attributes') return metadata.attributes && metadata.attributes.length > 0;
      if (field === 'properties') return metadata.properties && Object.keys(metadata.properties).length > 0;
      return metadata[field] && metadata[field].toString().length > 0;
    }).length;

    return completed / fields.length;
  }

  private calculateSEOScore(metadata: any, keywords: string[]): number {
    let score = 0;

    // Title optimization
    if (metadata.name && metadata.name.length >= 3 && metadata.name.length <= 32) score += 0.2;
    
    // Description optimization
    if (metadata.description && metadata.description.length >= 50 && metadata.description.length <= 160) score += 0.3;
    
    // Keywords in content
    if (keywords.length > 0) {
      const content = `${metadata.name} ${metadata.description}`.toLowerCase();
      const matchingKeywords = keywords.filter(k => content.includes(k.toLowerCase()));
      score += (matchingKeywords.length / keywords.length) * 0.3;
    }
    
    // Rich metadata
    if (metadata.attributes && metadata.attributes.length > 0) score += 0.2;

    return Math.min(score, 1);
  }

  private calculateEngagementPotential(metadata: any): number {
    let score = 0;

    // Visual appeal
    if (metadata.image) score += 0.3;
    if (metadata.animation_url) score += 0.2;
    
    // Social elements
    if (metadata.external_url) score += 0.2;
    if (metadata.properties?.social) score += 0.1;
    
    // Uniqueness
    if (metadata.attributes && metadata.attributes.length > 3) score += 0.2;

    return Math.min(score, 1);
  }

  private generateRecommendations(scores: any, metadata: any): string[] {
    const recommendations: string[] = [];

    if (scores.completenessScore < 0.7) {
      recommendations.push('Add more metadata fields to improve completeness');
    }
    if (scores.seoScore < 0.6) {
      recommendations.push('Optimize title and description for better discoverability');
    }
    if (scores.engagementPotential < 0.5) {
      recommendations.push('Add visual elements and social links to increase engagement');
    }
    if (scores.lastUpdateDays > 30) {
      recommendations.push('Consider updating metadata to maintain relevance');
    }
    if (!metadata.attributes || metadata.attributes.length === 0) {
      recommendations.push('Add attributes to make your token more unique and searchable');
    }

    return recommendations.length > 0 ? recommendations : ['Metadata looks great! Keep monitoring and updating as needed.'];
  }

  private daysSinceCreation(history: any[]): number {
    if (history.length === 0) return 1;
    const oldest = history[history.length - 1];
    return this.daysSince(oldest.timestamp);
  }

  private daysSince(timestamp: string | Date): number {
    const date = new Date(timestamp);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const aiMetadataService = AIMetadataService.getInstance();
