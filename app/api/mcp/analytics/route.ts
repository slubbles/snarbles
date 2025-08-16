import { NextResponse } from 'next/server';
import { MCPAnalyticsService } from '@/lib/mcp-analytics-service';

// Configure for static export
export const dynamic = 'force-static';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') as '24h' | '7d' | '30d') || '7d';
    
    const [insights, performance, tokenMetrics] = await Promise.all([
      MCPAnalyticsService.getPlatformInsights(timeframe),
      MCPAnalyticsService.getPerformanceMetrics(),
      MCPAnalyticsService.getTokenCreationMetrics()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        insights,
        performance,
        tokenMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('MCP Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const events = await request.json();
    
    // Handle batch event tracking
    if (Array.isArray(events)) {
      // This would integrate with your tracking service
      // For now, return success
      return NextResponse.json({
        success: true,
        message: `Processed ${events.length} events`
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid event data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('MCP Analytics Batch Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process events' },
      { status: 500 }
    );
  }
}
