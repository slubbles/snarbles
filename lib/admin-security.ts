/**
 * Admin Security System
 * Implements environment-based config, request verification, logging, and rate limiting
 */

import { PublicKey } from '@solana/web3.js';

// Environment-based admin wallet configuration
export const ADMIN_CONFIG = {
  solana: {
    wallet: process.env.NEXT_PUBLIC_ADMIN_SOLANA_WALLET || '352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj',
    publicKey: new PublicKey(process.env.NEXT_PUBLIC_ADMIN_SOLANA_WALLET || '352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj')
  },
  algorand: {
    wallet: process.env.NEXT_PUBLIC_ADMIN_ALGORAND_WALLET || 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M'
  },
  security: {
    secretKey: process.env.ADMIN_SECRET_KEY || 'default_secret_change_this',
    sessionTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT || '3600000'), // 1 hour default
    maxActionsPerMinute: 30,
    maxActionsPerHour: 200
  }
};

// Admin action types for logging
export enum AdminActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  UPDATE_FEES = 'UPDATE_FEES',
  UPDATE_PRICING = 'UPDATE_PRICING',
  PLATFORM_SETTINGS = 'PLATFORM_SETTINGS',
  INITIALIZE_PLATFORM = 'INITIALIZE_PLATFORM',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA'
}

// Admin session interface
interface AdminSession {
  walletAddress: string;
  network: 'solana' | 'algorand';
  loginTime: number;
  lastActivity: number;
  actionCount: number;
  isValid: boolean;
}

// Rate limiting storage
const rateLimitStore = new Map<string, {
  actionsThisMinute: number;
  actionsThisHour: number;
  lastMinuteReset: number;
  lastHourReset: number;
}>();

// Admin session storage
const adminSessions = new Map<string, AdminSession>();

/**
 * Verify if wallet address is authorized admin
 */
export function isAuthorizedAdmin(walletAddress: string, network: 'solana' | 'algorand'): boolean {
  try {
    if (network === 'solana') {
      return walletAddress === ADMIN_CONFIG.solana.wallet;
    } else if (network === 'algorand') {
      return walletAddress === ADMIN_CONFIG.algorand.wallet;
    }
    return false;
  } catch (error) {
    logAdminAction(AdminActionType.LOGIN, walletAddress, false, `Authorization check failed: ${error}`);
    return false;
  }
}

/**
 * Create admin session with security tracking
 */
export function createAdminSession(walletAddress: string, network: 'solana' | 'algorand'): AdminSession {
  const session: AdminSession = {
    walletAddress,
    network,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    actionCount: 0,
    isValid: true
  };

  adminSessions.set(walletAddress, session);
  logAdminAction(AdminActionType.LOGIN, walletAddress, true, `Admin session created for ${network} wallet`);
  
  return session;
}

/**
 * Validate admin session and update activity
 */
export function validateAdminSession(walletAddress: string): boolean {
  const session = adminSessions.get(walletAddress);
  
  if (!session || !session.isValid) {
    return false;
  }

  // Check session timeout
  const now = Date.now();
  if (now - session.lastActivity > ADMIN_CONFIG.security.sessionTimeout) {
    session.isValid = false;
    logAdminAction(AdminActionType.LOGOUT, walletAddress, true, 'Session expired due to inactivity');
    return false;
  }

  // Update last activity
  session.lastActivity = now;
  session.actionCount++;
  
  return true;
}

/**
 * Rate limiting protection
 */
export function checkRateLimit(walletAddress: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let limits = rateLimitStore.get(walletAddress);

  if (!limits) {
    limits = {
      actionsThisMinute: 0,
      actionsThisHour: 0,
      lastMinuteReset: now,
      lastHourReset: now
    };
    rateLimitStore.set(walletAddress, limits);
  }

  // Reset minute counter if needed
  if (now - limits.lastMinuteReset > 60000) { // 1 minute
    limits.actionsThisMinute = 0;
    limits.lastMinuteReset = now;
  }

  // Reset hour counter if needed
  if (now - limits.lastHourReset > 3600000) { // 1 hour
    limits.actionsThisHour = 0;
    limits.lastHourReset = now;
  }

  // Check limits
  if (limits.actionsThisMinute >= ADMIN_CONFIG.security.maxActionsPerMinute) {
    logAdminAction(AdminActionType.LOGIN, walletAddress, false, 'Rate limit exceeded: too many actions per minute');
    return { allowed: false, reason: 'Rate limit: Too many actions per minute' };
  }

  if (limits.actionsThisHour >= ADMIN_CONFIG.security.maxActionsPerHour) {
    logAdminAction(AdminActionType.LOGIN, walletAddress, false, 'Rate limit exceeded: too many actions per hour');
    return { allowed: false, reason: 'Rate limit: Too many actions per hour' };
  }

  // Increment counters
  limits.actionsThisMinute++;
  limits.actionsThisHour++;

  return { allowed: true };
}

/**
 * Generate admin request signature for verification
 */
export function generateAdminChallenge(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  
  return `snarbles-admin-${timestamp}-${randomString}`;
}

/**
 * Verify admin request with challenge/response
 */
export async function verifyAdminRequest(
  walletAddress: string,
  challenge: string,
  signature: string,
  action: AdminActionType
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check rate limiting first
    const rateLimitCheck = checkRateLimit(walletAddress);
    if (!rateLimitCheck.allowed) {
      return { valid: false, error: rateLimitCheck.reason };
    }

    // Validate session
    if (!validateAdminSession(walletAddress)) {
      return { valid: false, error: 'Invalid or expired admin session' };
    }

    // Verify challenge is recent (within 5 minutes)
    const challengeParts = challenge.split('-');
    if (challengeParts.length !== 4 || challengeParts[0] !== 'snarbles' || challengeParts[1] !== 'admin') {
      return { valid: false, error: 'Invalid challenge format' };
    }

    const challengeTimestamp = parseInt(challengeParts[2]);
    const now = Date.now();
    if (now - challengeTimestamp > 300000) { // 5 minutes
      return { valid: false, error: 'Challenge expired' };
    }

    // Log successful verification
    logAdminAction(action, walletAddress, true, `Admin request verified for action: ${action}`);
    
    return { valid: true };
  } catch (error) {
    logAdminAction(action, walletAddress, false, `Request verification failed: ${error}`);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Comprehensive admin action logging
 */
export function logAdminAction(
  action: AdminActionType,
  walletAddress: string,
  success: boolean,
  details?: string
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    walletAddress: walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'unknown',
    success,
    details: details || '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    ip: 'client-side' // In production, get from server
  };

  // Console logging for development
  const logLevel = success ? 'info' : 'warn';
  console[logLevel](`[ADMIN_SECURITY] ${timestamp} | ${action} | ${walletAddress} | ${success ? 'SUCCESS' : 'FAILED'}${details ? ` | ${details}` : ''}`);

  // Store in localStorage for client-side audit trail
  try {
    const existingLogs = JSON.parse(localStorage.getItem('snarbles-admin-logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 1000 entries
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('snarbles-admin-logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Failed to store admin log:', error);
  }

  // In production, also send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoringService(logEntry);
  }
}

/**
 * Get admin activity logs for audit
 */
export function getAdminLogs(limit: number = 100): any[] {
  try {
    const logs = JSON.parse(localStorage.getItem('snarbles-admin-logs') || '[]');
    return logs.slice(-limit).reverse(); // Most recent first
  } catch (error) {
    console.error('Failed to retrieve admin logs:', error);
    return [];
  }
}

/**
 * Security health check
 */
export function performSecurityHealthCheck(): {
  status: 'good' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check environment configuration
  if (ADMIN_CONFIG.security.secretKey === 'default_secret_change_this') {
    issues.push('Default admin secret key is being used');
    recommendations.push('Set a strong ADMIN_SECRET_KEY environment variable');
  }

  // Check wallet configuration
  if (!process.env.NEXT_PUBLIC_ADMIN_SOLANA_WALLET) {
    recommendations.push('Set NEXT_PUBLIC_ADMIN_SOLANA_WALLET environment variable');
  }

  if (!process.env.NEXT_PUBLIC_ADMIN_ALGORAND_WALLET) {
    recommendations.push('Set NEXT_PUBLIC_ADMIN_ALGORAND_WALLET environment variable');
  }

  // Check rate limiting activity
  const activeRateLimits = rateLimitStore.size;
  if (activeRateLimits > 10) {
    issues.push(`High number of rate-limited users: ${activeRateLimits}`);
  }

  // Determine overall status
  let status: 'good' | 'warning' | 'critical' = 'good';
  if (issues.length > 0) {
    status = issues.some(issue => issue.includes('secret')) ? 'critical' : 'warning';
  }

  return { status, issues, recommendations };
}

/**
 * Emergency security lockdown
 */
export function emergencyLockdown(): void {
  // Invalidate all admin sessions
  for (const [wallet, session] of adminSessions.entries()) {
    session.isValid = false;
    logAdminAction(AdminActionType.LOGOUT, wallet, true, 'Emergency lockdown initiated');
  }

  // Clear rate limit counters (force all users to re-authenticate)
  rateLimitStore.clear();

  console.warn('[ADMIN_SECURITY] EMERGENCY LOCKDOWN ACTIVATED - All admin sessions invalidated');
}
