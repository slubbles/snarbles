import { supabase, isSupabaseAvailable } from './supabase-client';

/**
 * Tracks a wallet event in Supabase analytics_events table (wallet-based)
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  walletAddress?: string
) {
  if (!isSupabaseAvailable()) {
    return { success: false, message: 'Supabase not configured' };
  }
  
  try {
    // Insert event into analytics_events table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([{
        wallet_address: walletAddress || null, // Can be null for anonymous events
        event_name: eventName,
        event_properties: properties || {},
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    return { success: true };
    
  } catch (error) {
    console.error('Error tracking event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error tracking event'
    };
  }
}

/**
 * Track token creation events
 */
export function trackTokenCreation(
  properties: {
    tokenName: string;
    tokenSymbol: string;
    network: string;
    successful: boolean;
    error?: string;
  },
  walletAddress?: string
) {
  return trackEvent(
    'token_creation',
    properties,
    walletAddress
  );
}

/**
 * Track wallet connection events
 */
export function trackWalletConnection(
  properties: {
    walletType: string;
    network: string;
    successful: boolean;
    error?: string;
  },
  walletAddress?: string
) {
  return trackEvent(
    'wallet_connection',
    properties,
    walletAddress
  );
}

/**
 * Track page views
 */
export function trackPageView(
  pageName: string,
  properties?: Record<string, any>,
  walletAddress?: string
) {
  return trackEvent(
    'page_view',
    { page: pageName, ...properties },
    walletAddress
  );
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  featureName: string,
  properties?: Record<string, any>,
  walletAddress?: string
) {
  return trackEvent(
    'feature_usage',
    { feature: featureName, ...properties },
    walletAddress
  );
}