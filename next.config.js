/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
  }),
  poweredByHeader: false,
  reactStrictMode: false,
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },    
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: false,
    scrollRestoration: false,
    forceSwcTransforms: true,
  },
  // Add security headers for Solana WebSocket connections and GitHub Codespaces
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.github.dev",
              "style-src 'self' 'unsafe-inline' *.github.dev",
              "img-src 'self' data: blob: https: *.github.dev",
              "font-src 'self' data: *.github.dev",
              "connect-src 'self' data: https://*.supabase.co https://api.devnet.solana.com https://api.mainnet-beta.solana.com https://testnet-api.algonode.cloud https://mainnet-api.algonode.cloud https://testnet-idx.algonode.cloud https://mainnet-idx.algonode.cloud https://wc.perawallet.app https://*.perawallet.app https://s3.amazonaws.com https://*.github.dev *.github.dev wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com wss://*.perawallet.app wss://*.bridge.walletconnect.org wss://*.walletconnect.org https://*.walletconnect.org",
              "worker-src 'self' blob:",
              "frame-src 'self' https://verify.walletconnect.com *.github.dev",
              "manifest-src 'self' *.github.dev",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  },
  // Simplified webpack configuration
  webpack: (config, { webpack, isServer }) => {
    // Add polyfills for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
      fs: false,
      net: false,
      tls: false,
      encoding: false,
      'pino-pretty': false,
    };

    // Make Buffer and process globally available
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Ignore problematic modules for client-side bundles
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ws: false,
        'pino-pretty': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;