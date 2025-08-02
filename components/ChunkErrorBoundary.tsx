'use client';

import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a chunk loading error
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message.includes('Loading chunk') ||
                        error.message.includes('Loading CSS chunk');
    
    if (isChunkError) {
      console.warn('🔄 Chunk loading error detected, attempting reload:', error);
      // Attempt to reload the page for chunk errors
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ChunkErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Loading Error</h2>
            <p className="text-muted-foreground mb-4">
              There was an issue loading the application. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
