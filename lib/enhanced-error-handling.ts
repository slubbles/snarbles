import { toast } from '@/hooks/use-toast';

export interface ErrorInfo {
  code?: string | number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'wallet' | 'contract' | 'validation' | 'auth' | 'credits' | 'system';
  userMessage: string;
  suggestedAction?: string;
  retryable: boolean;
  helpUrl?: string;
}

// Common error patterns and their mappings
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  mapping: Partial<ErrorInfo>;
}> = [
  // Wallet Connection Errors
  {
    pattern: /wallet.*not.*connected|no.*wallet/i,
    mapping: {
      category: 'wallet',
      severity: 'high',
      userMessage: 'Wallet not connected',
      suggestedAction: 'Please connect your wallet and try again',
      retryable: true
    }
  },
  {
    pattern: /user.*rejected|transaction.*rejected|denied by user/i,
    mapping: {
      category: 'wallet',
      severity: 'medium',
      userMessage: 'Transaction was cancelled',
      suggestedAction: 'Please approve the transaction in your wallet',
      retryable: true
    }
  },
  
  // Network Errors
  {
    pattern: /network.*error|connection.*failed|timeout/i,
    mapping: {
      category: 'network',
      severity: 'medium',
      userMessage: 'Network connection issue',
      suggestedAction: 'Check your internet connection and try again',
      retryable: true
    }
  },
  {
    pattern: /insufficient.*funds|not enough.*balance/i,
    mapping: {
      category: 'wallet',
      severity: 'high',
      userMessage: 'Insufficient balance',
      suggestedAction: 'Add funds to your wallet and try again',
      retryable: true
    }
  },
  
  // Smart Contract Errors
  {
    pattern: /program.*error|instruction.*failed|anchor.*error/i,
    mapping: {
      category: 'contract',
      severity: 'high',
      userMessage: 'Smart contract error',
      suggestedAction: 'This may be a temporary issue. Please try again in a few minutes',
      retryable: true
    }
  },
  {
    pattern: /NameTooLong|name.*too.*long/i,
    mapping: {
      category: 'validation',
      severity: 'medium',
      userMessage: 'Token name is too long',
      suggestedAction: 'Please use a shorter name (32 characters or less)',
      retryable: true
    }
  },
  {
    pattern: /SymbolTooLong|symbol.*too.*long/i,
    mapping: {
      category: 'validation',
      severity: 'medium',
      userMessage: 'Token symbol is too long',
      suggestedAction: 'Please use a shorter symbol (10 characters or less)',
      retryable: true
    }
  },
  
  // Credits System Errors
  {
    pattern: /insufficient.*credits|not enough.*credits/i,
    mapping: {
      category: 'credits',
      severity: 'high',
      userMessage: 'Insufficient credits',
      suggestedAction: 'Please top up your account to continue',
      retryable: true
    }
  },
  
  // Authentication Errors
  {
    pattern: /not.*authenticated|auth.*required|login.*required/i,
    mapping: {
      category: 'auth',
      severity: 'high',
      userMessage: 'Authentication required',
      suggestedAction: 'Please log in to continue',
      retryable: true
    }
  },
  
  // Validation Errors
  {
    pattern: /invalid.*input|validation.*failed|required.*field/i,
    mapping: {
      category: 'validation',
      severity: 'medium',
      userMessage: 'Please check your input',
      suggestedAction: 'Make sure all required fields are filled correctly',
      retryable: true
    }
  }
];

/**
 * Enhanced error classification and messaging
 */
export function classifyAndFormatError(error: any): ErrorInfo {
  const errorMessage = getErrorMessage(error);
  const code = getErrorCode(error);
  
  // Try to match against known patterns
  for (const { pattern, mapping } of ERROR_PATTERNS) {
    const isMatch = pattern instanceof RegExp 
      ? pattern.test(errorMessage)
      : errorMessage.toLowerCase().includes(pattern.toLowerCase());
      
    if (isMatch) {
      return {
        code,
        message: errorMessage,
        severity: mapping.severity || 'medium',
        category: mapping.category || 'system',
        userMessage: mapping.userMessage || errorMessage,
        suggestedAction: mapping.suggestedAction,
        retryable: mapping.retryable !== false,
        helpUrl: mapping.helpUrl,
        ...mapping
      };
    }
  }
  
  // Default error info for unmatched errors
  return {
    code,
    message: errorMessage,
    severity: 'medium',
    category: 'system',
    userMessage: 'An unexpected error occurred',
    suggestedAction: 'Please try again or contact support if the issue persists',
    retryable: true
  };
}

/**
 * Extract error message from various error formats
 */
function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.toString) {
    return error.toString();
  }
  
  return 'Unknown error occurred';
}

/**
 * Extract error code from various error formats
 */
function getErrorCode(error: any): string | number | undefined {
  if (error?.code) {
    return error.code;
  }
  
  if (error?.error?.code) {
    return error.error.code;
  }
  
  // For Anchor errors
  if (error?.programErrorStack?.length > 0) {
    return error.programErrorStack[0]?.code;
  }
  
  return undefined;
}

/**
 * Enhanced toast notification with better UX
 */
export function showErrorToast(errorInfo: ErrorInfo) {
  const duration = getDurationBySeverity(errorInfo.severity);
  
  toast({
    title: errorInfo.userMessage,
    description: errorInfo.suggestedAction || undefined,
    variant: getVariantBySeverity(errorInfo.severity),
    duration
  });
}

/**
 * Get toast duration based on error severity
 */
function getDurationBySeverity(severity: ErrorInfo['severity']): number {
  switch (severity) {
    case 'low': return 3000;
    case 'medium': return 5000;
    case 'high': return 8000;
    case 'critical': return 0; // Never auto-dismiss
    default: return 5000;
  }
}

/**
 * Get toast variant based on error severity
 */
function getVariantBySeverity(severity: ErrorInfo['severity']): 'default' | 'destructive' {
  switch (severity) {
    case 'low':
    case 'medium':
      return 'default';
    case 'high':
    case 'critical':
      return 'destructive';
    default:
      return 'default';
  }
}

/**
 * Enhanced error logging for development and debugging
 */
export function logError(error: any, context?: string) {
  const errorInfo = classifyAndFormatError(error);
  
  console.group(`🚨 Error ${context ? `in ${context}` : ''}`);
  console.error('Raw error:', error);
  console.log('Classified info:', errorInfo);
  console.log('Category:', errorInfo.category);
  console.log('Severity:', errorInfo.severity);
  console.log('Retryable:', errorInfo.retryable);
  
  if (errorInfo.code) {
    console.log('Error code:', errorInfo.code);
  }
  
  // Log stack trace if available
  if (error?.stack) {
    console.log('Stack trace:', error.stack);
  }
  
  console.groupEnd();
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production' && errorInfo.severity === 'critical') {
    // Send to logging service (e.g., Sentry, LogRocket, etc.)
    // sendToLoggingService(errorInfo, error);
  }
}

/**
 * Generic error handler with retryable logic
 */
export async function handleErrorWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context?: string
): Promise<{ success: boolean; data?: T; error?: ErrorInfo }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error;
      const errorInfo = classifyAndFormatError(error);
      
      logError(error, `${context} (attempt ${attempt}/${maxRetries})`);
      
      // Don't retry if error is not retryable
      if (!errorInfo.retryable) {
        return { success: false, error: errorInfo };
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        return { success: false, error: errorInfo };
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but just in case
  const errorInfo = classifyAndFormatError(lastError);
  return { success: false, error: errorInfo };
}

/**
 * Validation error helpers
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function createValidationError(field: string, message: string, value?: any): ValidationError {
  return new ValidationError(`${field}: ${message}`, field, value);
}

/**
 * Network-specific error handling
 */
export function getNetworkErrorInfo(networkName: string): Partial<ErrorInfo> {
  switch (networkName.toLowerCase()) {
    case 'algorand':
    case 'algorand-mainnet':
    case 'algorand-testnet':
      return {
        helpUrl: 'https://developer.algorand.org/docs/get-started/dapps/pyteal/',
        suggestedAction: 'Check Algorand network status and your wallet connection'
      };
    case 'solana':
    case 'solana-devnet':
    case 'solana-testnet':
    case 'solana-mainnet':
      return {
        helpUrl: 'https://docs.solana.com/developing/programming-model/overview',
        suggestedAction: 'Check Solana network status and your wallet connection'
      };
    default:
      return {};
  }
}

/**
 * Credit system error handling
 */
export function getCreditErrorMessage(creditsNeeded: number, creditsAvailable: number): string {
  const shortfall = creditsNeeded - creditsAvailable;
  return `You need ${creditsNeeded} credits but only have ${creditsAvailable}. Please purchase ${shortfall} more credits to continue.`;
} 