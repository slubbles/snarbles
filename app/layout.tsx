import './globals.css';
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import Footer from '@/components/layout/Footer';
import NavbarOptimized from '@/components/layout/Navbar';
import BoltBadge from '@/components/BoltBadge';
import { Toaster } from '@/components/ui/toaster';
import { WalletAuthProvider } from '@/components/providers/WalletAuthProvider';
import ClientWalletProvider from '@/components/providers/ClientWalletProvider';
import { SkipToMain } from '@/components/ui/accessibility';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
import { MCPAnalyticsProvider } from '@/components/providers/MCPAnalyticsProvider';
import { generateMetadata as generateSEOMetadata, generateStructuredData, faqStructuredData } from "@/lib/seo";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = generateSEOMetadata({
  title: "Snarbles - Create Professional Crypto Tokens in Under 30 Seconds | 8,000+ Users",
  description: "🚀 Join 8,000+ crypto innovators using Snarbles to create professional Algorand & Solana tokens. Zero coding required. Advanced analytics included. Start free today and launch your crypto project in minutes.",
  keywords: [
    'token creation platform',
    'create cryptocurrency token', 
    'algorand token creation',
    'solana token creation',
    'blockchain token generator',
    'token maker',
    'crypto token builder',
    'how to create a token',
    'professional token development',
    'blockchain token deployment',
    'crypto project launch',
    'tokenomics designer',
    'blockchain analytics',
    'no code token creation',
    'instant token deployment'
  ],
  url: '/',
  priority: 1.0,
  changefreq: 'daily'
});

// Generate structured data for the homepage
const homepageStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Snarbles",
  "description": "Professional Token Creation Platform - Create Crypto Tokens in Under 30 Seconds",
  "url": "https://snarbles.xyz",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "description": "Free token creation with advanced analytics",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 847,
    "bestRating": 5,
    "worstRating": 1
  },
  "author": {
    "@type": "Organization",
    "name": "Snarbles",
    "url": "https://snarbles.xyz"
  }
});

// Generate organization structured data
const organizationStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Snarbles",
  "description": "Leading token creation platform trusted by 8,000+ crypto innovators",
  "url": "https://snarbles.xyz",
  "logo": "https://snarbles.xyz/images/snarbles-logo.png",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/snarbles",
    "https://github.com/snarbles"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@snarbles.xyz"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 847,
    "bestRating": 5,
    "worstRating": 1
  }
});

// Service worker registration component
function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined') {
    // Register service worker on client side
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }

    // Global chunk loading error handler
    window.addEventListener('error', (event) => {
      const { message, filename } = event;
      const isChunkError = message.includes('Loading chunk') || 
                          message.includes('ChunkLoadError') ||
                          filename?.includes('/_next/static/chunks/');
      
      if (isChunkError) {
        console.warn('🔄 Chunk loading error detected, reloading page');
        window.location.reload();
      }
    });

    // Handle unhandled promise rejections for chunk loading
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const isChunkError = error?.name === 'ChunkLoadError' ||
                          error?.message?.includes('Loading chunk');
      
      if (isChunkError) {
        console.warn('🔄 Chunk loading promise rejection, reloading page');
        event.preventDefault();
        window.location.reload();
      }
    });
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Enhanced SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        
        {/* DNS Prefetch and Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.algorand.com" />
        <link rel="dns-prefetch" href="https://mainnet-api.algonode.cloud" />
        <link rel="dns-prefetch" href="https://api.solana.com" />
        
        {/* Optimized Font Loading */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon2.png" />
        <link rel="apple-touch-icon" href="/favicon2.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: homepageStructuredData }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationStructuredData }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        
        {/* Performance Hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ChunkErrorBoundary>
          <ClientWalletProvider>
            <WalletAuthProvider>
              <MCPAnalyticsProvider />
              <SkipToMain />
              <div className="flex min-h-screen flex-col">
                <NavbarOptimized />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <BoltBadge />
              <Toaster />
              <ServiceWorkerRegistration />
            </WalletAuthProvider>
          </ClientWalletProvider>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
