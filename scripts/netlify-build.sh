#!/bin/bash

# Netlify Build Script for Snarbles
echo "🚀 Starting Netlify build for Snarbles..."

# Set environment variables
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Clean any existing build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next out

# Rebuild native dependencies to fix BigInt warnings
echo "🔧 Rebuilding native dependencies..."
npm rebuild || echo "⚠️ Rebuild failed, continuing with build..."

# Run the Next.js build
echo "📦 Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output directory: .next"
    
    # List important build files
    echo "📋 Build contents:"
    ls -la .next/ | head -10
    
else
    echo "❌ Build failed!"
    exit 1
fi
