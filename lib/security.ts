/**
 * Security and Rate Limiting System
 * Provides client-side security measures and rate limiting
 */

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  tokenCreation: { windowMs: 60000, maxRequests: 3 }, // 3 per minute
  walletConnection: { windowMs: 30000, maxRequests: 5 }, // 5 per 30 seconds
  apiCall: { windowMs: 60000, maxRequests: 100 }, // 100 per minute
  pageView: { windowMs: 10000, maxRequests: 50 }, // 50 per 10 seconds
};

// Rate limiter class
export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // Check if action is allowed
  isAllowed(action: string, identifier: string = 'default'): boolean {
    const config = RATE_LIMITS[action];
    if (!config) {
      console.warn(`⚠️ No rate limit config for action: ${action}`);
      return true;
    }

    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove requests outside the current window
    requestTimes = requestTimes.filter(time => time > windowStart);

    // Check if limit exceeded
    if (requestTimes.length >= config.maxRequests) {
      console.warn(`🚫 Rate limit exceeded for ${action} by ${identifier}`);
      return false;
    }

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return true;
  }

  // Get remaining requests for an action
  getRemainingRequests(action: string, identifier: string = 'default'): number {
    const config = RATE_LIMITS[action];
    if (!config) return Infinity;

    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let requestTimes = this.requests.get(key) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);

    return Math.max(0, config.maxRequests - requestTimes.length);
  }

  // Reset rate limits for testing
  reset(): void {
    this.requests.clear();
  }
}

// Input validation and sanitization
export class InputValidator {
  // Validate wallet address
  static validateWalletAddress(address: string, network: 'solana' | 'algorand'): boolean {
    if (!address || typeof address !== 'string') return false;

    if (network === 'solana') {
      // Solana addresses are base58 encoded and 32-44 characters
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else if (network === 'algorand') {
      // Algorand addresses are 58 characters base32
      return /^[A-Z2-7]{58}$/.test(address);
    }

    return false;
  }

  // Validate token name
  static validateTokenName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    return name.length >= 1 && name.length <= 100 && /^[a-zA-Z0-9\s\-_\.]+$/.test(name);
  }

  // Validate token symbol
  static validateTokenSymbol(symbol: string): boolean {
    if (!symbol || typeof symbol !== 'string') return false;
    return symbol.length >= 1 && symbol.length <= 10 && /^[A-Z0-9]+$/.test(symbol);
  }

  // Validate URL
  static validateUrl(url: string): boolean {
    if (!url) return true; // URLs are optional
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Sanitize string input
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate token supply
  static validateTokenSupply(supply: string, decimals: number, network: string): boolean {
    try {
      const supplyNum = parseFloat(supply);
      if (isNaN(supplyNum) || supplyNum <= 0) return false;

      // Calculate total supply with decimals
      const totalSupply = BigInt(Math.floor(supplyNum * Math.pow(10, decimals)));

      if (network.startsWith('algorand')) {
        // Algorand max supply: 2^64 - 1
        return totalSupply <= BigInt('18446744073709551615');
      } else {
        // Solana/other networks: use JavaScript safe integer
        return totalSupply <= BigInt(Number.MAX_SAFE_INTEGER);
      }
    } catch {
      return false;
    }
  }
}

// Security headers and CSP management
export class SecurityManager {
  // Content Security Policy violations handler
  static setupCSPReporting(): void {
    if (typeof window !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        console.warn('🚨 CSP Violation:', {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy,
          documentURI: event.documentURI,
          referrer: event.referrer,
          statusCode: event.statusCode,
          effectiveDirective: event.effectiveDirective
        });

        // Track CSP violations for monitoring
        if (typeof window !== 'undefined' && 'navigator' in window) {
          // Send to monitoring service
          fetch('/api/security/csp-violation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blockedURI: event.blockedURI,
              violatedDirective: event.violatedDirective,
              documentURI: event.documentURI,
              timestamp: Date.now()
            })
          }).catch(() => {
            // Silently fail - don't want to cause recursive issues
          });
        }
      });
    }
  }

  // Check if current environment is secure
  static isSecureContext(): boolean {
    if (typeof window === 'undefined') return true;
    
    return (
      window.isSecureContext && 
      (location.protocol === 'https:' || location.hostname === 'localhost')
    );
  }

  // Validate referrer for sensitive operations
  static validateReferrer(): boolean {
    if (typeof document === 'undefined') return true;
    
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    
    // Allow same-origin or no referrer
    return !referrer || referrer.startsWith(currentOrigin);
  }

  // Generate secure random string
  static generateSecureRandom(length: number = 32): string {
    if (typeof window !== 'undefined' && 'crypto' in window) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for older browsers
    return Math.random().toString(36).substring(2, length + 2);
  }
}

// Session management
export class SessionManager {
  private static readonly SESSION_KEY = 'snarbles_session';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  // Create new session
  static createSession(): string {
    const sessionId = SecurityManager.generateSecureRandom();
    const session = {
      id: sessionId,
      created: Date.now(),
      lastActivity: Date.now(),
      userAgent: navigator.userAgent,
      origin: window.location.origin
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return sessionId;
  }

  // Get current session
  static getCurrentSession(): any | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session expired
      if (now - session.created > this.SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      // Update last activity
      session.lastActivity = now;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return session;
    } catch {
      return null;
    }
  }

  // Clear session
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Validate session security
  static validateSession(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;

    // Check if user agent changed (potential session hijacking)
    if (session.userAgent !== navigator.userAgent) {
      console.warn('🚨 Session security violation: User agent mismatch');
      this.clearSession();
      return false;
    }

    // Check if origin changed
    if (session.origin !== window.location.origin) {
      console.warn('🚨 Session security violation: Origin mismatch');
      this.clearSession();
      return false;
    }

    return true;
  }
}

// Blockchain interaction security
export class BlockchainSecurity {
  // Validate transaction before signing
  static validateTransaction(txData: any, expectedAmount?: number): boolean {
    if (!txData) return false;

    // Check for common attack vectors
    if (expectedAmount && txData.amount && Math.abs(txData.amount - expectedAmount) > 0.01) {
      console.warn('🚨 Transaction amount mismatch');
      return false;
    }

    // Validate recipient isn't a known bad address
    if (txData.to && this.isKnownMaliciousAddress(txData.to)) {
      console.warn('🚨 Transaction to known malicious address blocked');
      return false;
    }

    return true;
  }

  // Check against known malicious addresses
  private static isKnownMaliciousAddress(address: string): boolean {
    // This would contain a list of known scam/malicious addresses
    const knownBadAddresses: string[] = [
      // Add known malicious addresses here
    ];

    return knownBadAddresses.includes(address);
  }

  // Validate smart contract interaction
  static validateContractInteraction(contractAddress: string, network: string): boolean {
    // Validate contract address format
    const isValidAddress = InputValidator.validateWalletAddress(contractAddress, network as any);
    if (!isValidAddress) {
      console.warn('🚨 Invalid contract address format');
      return false;
    }

    // Additional contract-specific validations could go here
    return true;
  }
}

// Export singleton instances
export const rateLimiter = RateLimiter.getInstance();
export const securityManager = SecurityManager;
export const sessionManager = SessionManager;
export const blockchainSecurity = BlockchainSecurity; 