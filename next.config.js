/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standard build output for Netlify with API routes
  poweredByHeader: false,
  reactStrictMode: false,
  // Enhanced image optimization for better SEO
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // SEO and performance optimizations
  compress: true,
  generateEtags: true,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true, // Enable CSS optimization for better performance
    scrollRestoration: true,
    forceSwcTransforms: true,
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  // Add security headers for Solana WebSocket connections and GitHub Codespaces
  async headers() {
    // Skip CSP in development to avoid chunk loading issues
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.github.dev https://unpkg.com",
              "style-src 'self' 'unsafe-inline' *.github.dev https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: *.github.dev",
              "font-src 'self' data: *.github.dev https://fonts.gstatic.com",
              "connect-src 'self' data: https://*.supabase.co https://api.devnet.solana.com https://api.mainnet-beta.solana.com https://testnet-api.algonode.cloud https://mainnet-api.algonode.cloud https://testnet-idx.algonode.cloud https://mainnet-idx.algonode.cloud https://wc.perawallet.app https://*.perawallet.app https://s3.amazonaws.com https://*.github.dev *.github.dev wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com wss://*.perawallet.app wss://*.bridge.walletconnect.org wss://*.walletconnect.org https://*.walletconnect.org https://explorer.solana.com https://algoexplorer.io https://testnet.algoexplorer.io",
              "worker-src 'self' blob:",
              "frame-src 'self' https://verify.walletconnect.com *.github.dev",
              "manifest-src 'self' *.github.dev https://github.dev",
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
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // SEO-beneficial headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      },
      // Specific headers for static assets
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=86400'
          }
        ]
      }
    ]
  },
  // Add redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tokenomics-designer',
        destination: '/tokenomics',
        permanent: true,
      },
      {
        source: '/analytics-dashboard',
        destination: '/dashboard',
        permanent: true,
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