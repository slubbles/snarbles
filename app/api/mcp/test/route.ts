import { NextResponse } from 'next/server';
import { MCPTrackingService } from '@/lib/mcp-tracking-service';

// Configure for static export
export const dynamic = 'force-static';
export const revalidate = 0;

export async function GET() {
  try {
    // Test MCP tracking by inserting a test event
    await MCPTrackingService.track({
      event_name: 'mcp_test',
      event_properties: {
        test_type: 'api_endpoint',
        timestamp: Date.now(),
        message: 'MCP integration test successful'
      }
    });

    // Test getting real-time metrics
    const metrics = await MCPTrackingService.getRealtimeMetrics();

    return NextResponse.json({
      success: true,
      message: 'MCP analytics integration is working!',
      test_event_inserted: true,
      realtime_metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MCP Test Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'MCP integration test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
