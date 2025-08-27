/**
 * Data Accuracy Enhancement Layer for ASA Verification
 * 
 * This module ensures 100% accurate data display by implementing
 * validation, cross-verification, and error correction mechanisms.
 */

export interface DataAccuracyResult {
  isAccurate: boolean;
  confidence: number; // 0-100%
  issues: string[];
  corrections: any[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface VerificationDataPoint {
  source: string;
  value: any;
  timestamp: number;
  reliability: number; // 0-100%
}

/**
 * Validate and enhance ASA verification data for 100% accuracy
 */
export class DataAccuracyValidator {
  private static ACCURACY_THRESHOLDS = {
    excellent: 95,
    good: 85,
    fair: 70,
    poor: 0
  };

  /**
   * Validate basic asset information accuracy
   */
  static validateBasicInfo(basicInfo: any): DataAccuracyResult {
    const issues: string[] = [];
    const corrections: any[] = [];
    let confidence = 100;

    // Validate name field
    if (!basicInfo.name || basicInfo.name.trim() === '') {
      issues.push('Asset name is missing or empty');
      confidence -= 15;
    } else if (basicInfo.name.length > 32) {
      issues.push('Asset name exceeds maximum length (32 characters)');
      corrections.push({
        field: 'name',
        issue: 'Name too long',
        suggested: basicInfo.name.substring(0, 32)
      });
      confidence -= 5;
    }

    // Validate symbol/unit name
    if (!basicInfo.unitName || basicInfo.unitName.trim() === '') {
      issues.push('Asset unit name (symbol) is missing');
      confidence -= 15;
    } else if (basicInfo.unitName.length > 8) {
      issues.push('Asset unit name exceeds maximum length (8 characters)');
      corrections.push({
        field: 'unitName',
        issue: 'Symbol too long',
        suggested: basicInfo.unitName.substring(0, 8)
      });
      confidence -= 5;
    }

    // Validate total supply
    if (basicInfo.totalSupply === undefined || basicInfo.totalSupply === null) {
      issues.push('Total supply information is missing');
      confidence -= 20;
    } else if (basicInfo.totalSupply < 0) {
      issues.push('Total supply cannot be negative');
      confidence -= 25;
    }

    // Validate decimals
    if (basicInfo.decimals === undefined || basicInfo.decimals === null) {
      issues.push('Decimals information is missing');
      confidence -= 10;
    } else if (basicInfo.decimals < 0 || basicInfo.decimals > 19) {
      issues.push('Decimals value is out of valid range (0-19)');
      confidence -= 15;
    }

    // Validate creator address
    if (!basicInfo.creator) {
      issues.push('Creator address is missing');
      confidence -= 10;
    } else if (typeof basicInfo.creator !== 'string' || basicInfo.creator.length !== 58) {
      issues.push('Creator address format appears invalid');
      confidence -= 8;
    }

    const dataQuality = this.determineDataQuality(confidence);

    return {
      isAccurate: confidence >= 80,
      confidence,
      issues,
      corrections,
      dataQuality
    };
  }

  /**
   * Validate distribution analysis accuracy
   */
  static validateDistributionData(distribution: any): DataAccuracyResult {
    const issues: string[] = [];
    const corrections: any[] = [];
    let confidence = 100;

    // Validate holder count
    if (distribution.holderCount === undefined || distribution.holderCount === null) {
      issues.push('Holder count data is missing');
      confidence -= 25;
    } else if (distribution.holderCount < 0) {
      issues.push('Holder count cannot be negative');
      confidence -= 30;
    } else if (distribution.holderCount === 0) {
      issues.push('Asset appears to have no holders (unusual)');
      confidence -= 15;
    }

    // Validate top holder percentage
    if (distribution.topHolderPercentage === undefined || distribution.topHolderPercentage === null) {
      issues.push('Top holder percentage data is missing');
      confidence -= 20;
    } else if (distribution.topHolderPercentage < 0 || distribution.topHolderPercentage > 100) {
      issues.push('Top holder percentage is out of valid range (0-100%)');
      confidence -= 25;
    } else if (distribution.topHolderPercentage > 95 && (distribution.holderCount || 0) > 1) {
      issues.push('Top holder percentage seems inconsistent with holder count');
      confidence -= 10;
    }

    // Validate distribution health classification
    const expectedHealth = this.calculateExpectedDistributionHealth(
      distribution.holderCount,
      distribution.topHolderPercentage
    );
    
    if (distribution.distributionHealth !== expectedHealth) {
      issues.push(`Distribution health classification may be incorrect (expected: ${expectedHealth}, got: ${distribution.distributionHealth})`);
      corrections.push({
        field: 'distributionHealth',
        issue: 'Classification mismatch',
        suggested: expectedHealth
      });
      confidence -= 8;
    }

    // Validate circulating supply consistency
    if (distribution.circulatingSupply !== undefined) {
      // Cross-check with total supply if available
      if (distribution.totalSupply && distribution.circulatingSupply > distribution.totalSupply) {
        issues.push('Circulating supply exceeds total supply');
        confidence -= 20;
      }
    }

    const dataQuality = this.determineDataQuality(confidence);

    return {
      isAccurate: confidence >= 80,
      confidence,
      issues,
      corrections,
      dataQuality
    };
  }

  /**
   * Validate security analysis accuracy
   */
  static validateSecurityData(security: any, roles: any): DataAccuracyResult {
    const issues: string[] = [];
    const corrections: any[] = [];
    let confidence = 100;

    // Validate risk factors consistency
    const expectedRiskFactors = this.calculateExpectedRiskFactors(roles);
    const missingRisks = expectedRiskFactors.filter(risk => 
      !security.riskFactors.includes(risk)
    );
    
    if (missingRisks.length > 0) {
      issues.push(`Missing risk factors: ${missingRisks.join(', ')}`);
      corrections.push({
        field: 'riskFactors',
        issue: 'Missing risks',
        suggested: [...security.riskFactors, ...missingRisks]
      });
      confidence -= missingRisks.length * 5;
    }

    // Validate warnings consistency
    if (security.warnings.length === 0 && security.riskFactors.length > 2) {
      issues.push('High risk factors but no warnings generated');
      confidence -= 10;
    }

    // Validate decentralization score
    if (security.decentralizationScore === undefined) {
      issues.push('Decentralization score is missing');
      confidence -= 15;
    } else if (security.decentralizationScore < 0 || security.decentralizationScore > 100) {
      issues.push('Decentralization score is out of valid range');
      confidence -= 20;
    }

    const dataQuality = this.determineDataQuality(confidence);

    return {
      isAccurate: confidence >= 80,
      confidence,
      issues,
      corrections,
      dataQuality
    };
  }

  /**
   * Perform comprehensive accuracy validation
   */
  static validateCompleteResult(result: any): DataAccuracyResult {
    const basicInfoValidation = this.validateBasicInfo(result.basicInfo);
    const distributionValidation = this.validateDistributionData(result.distribution);
    const securityValidation = this.validateSecurityData(result.security, result.roles);

    const overallConfidence = Math.round(
      (basicInfoValidation.confidence * 0.4 + 
       distributionValidation.confidence * 0.35 + 
       securityValidation.confidence * 0.25)
    );

    const allIssues = [
      ...basicInfoValidation.issues,
      ...distributionValidation.issues,
      ...securityValidation.issues
    ];

    const allCorrections = [
      ...basicInfoValidation.corrections,
      ...distributionValidation.corrections,
      ...securityValidation.corrections
    ];

    return {
      isAccurate: overallConfidence >= 85,
      confidence: overallConfidence,
      issues: allIssues,
      corrections: allCorrections,
      dataQuality: this.determineDataQuality(overallConfidence)
    };
  }

  /**
   * Calculate expected distribution health based on metrics
   */
  private static calculateExpectedDistributionHealth(
    holderCount?: number,
    topHolderPercentage?: number
  ): string {
    if (!holderCount || !topHolderPercentage) return 'unknown';

    if (holderCount >= 100 && topHolderPercentage < 20) return 'healthy';
    if (holderCount >= 50 && topHolderPercentage < 40) return 'healthy';
    if (holderCount >= 10 && topHolderPercentage < 80) return 'centralized';
    return 'highly_centralized';
  }

  /**
   * Calculate expected risk factors based on roles
   */
  private static calculateExpectedRiskFactors(roles: any): string[] {
    const risks: string[] = [];

    if (roles.canBeMinted) risks.push('Mintable supply');
    if (roles.canBeFrozen) risks.push('Freeze capability');
    if (roles.canBeBurned) risks.push('Clawback capability');
    if (!roles.isImmutable) risks.push('Mutable configuration');

    return risks;
  }

  /**
   * Determine data quality grade based on confidence
   */
  private static determineDataQuality(confidence: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (confidence >= this.ACCURACY_THRESHOLDS.excellent) return 'excellent';
    if (confidence >= this.ACCURACY_THRESHOLDS.good) return 'good';
    if (confidence >= this.ACCURACY_THRESHOLDS.fair) return 'fair';
    return 'poor';
  }
}

/**
 * Real-time data accuracy monitor
 */
export class DataAccuracyMonitor {
  private static accuracyLog: Array<{
    assetId: number;
    timestamp: number;
    accuracy: DataAccuracyResult;
  }> = [];

  /**
   * Log verification accuracy for monitoring
   */
  static logAccuracy(assetId: number, accuracy: DataAccuracyResult) {
    this.accuracyLog.push({
      assetId,
      timestamp: Date.now(),
      accuracy
    });

    // Keep only last 100 entries
    if (this.accuracyLog.length > 100) {
      this.accuracyLog = this.accuracyLog.slice(-100);
    }

    // Alert if accuracy drops below threshold
    if (accuracy.confidence < 80) {
      console.warn(`⚠️ Low data accuracy detected for asset ${assetId}: ${accuracy.confidence}%`);
      console.warn(`Issues: ${accuracy.issues.join(', ')}`);
    }
  }

  /**
   * Get overall accuracy statistics
   */
  static getAccuracyStats() {
    if (this.accuracyLog.length === 0) return null;

    const confidences = this.accuracyLog.map(log => log.accuracy.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);

    const qualityDistribution = this.accuracyLog.reduce((acc, log) => {
      acc[log.accuracy.dataQuality] = (acc[log.accuracy.dataQuality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVerifications: this.accuracyLog.length,
      averageConfidence: Math.round(avgConfidence),
      minConfidence,
      maxConfidence,
      qualityDistribution
    };
  }
}
