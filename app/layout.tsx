import './globals.css';
import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import NavbarOptimized from '@/components/layout/Navbar';
import BoltBadge from '@/components/BoltBadge';
import { Toaster } from '@/components/ui/toaster';
import { WalletAuthProvider } from '@/components/providers/WalletAuthProvider';
import ClientWalletProvider from '@/components/providers/ClientWalletProvider';
import { SkipToMain } from '@/components/ui/accessibility';
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
import { MCPAnalyticsProvider } from '@/components/providers/MCPAnalyticsProvider';

    export const metadata: Metadata = {
      title: 'Snarbles - Create Your Own Token in 30 Seconds',
      description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
      metadataBase: new URL('https://snarbles.com'),
      keywords: 'token creation, cryptocurrency, blockchain, solana, defi, web3',
      authors: [{ name: 'Snarbles Team' }],
      creator: 'Snarbles',
      publisher: 'Snarbles',
      openGraph: {
        title: 'Snarbles - Create Your Own Token in 30 Seconds',
        description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
        url: 'https://snarbles.com',
        siteName: 'Snarbles',
        images: [
          {
            url: '/pSsNHPck_400x400.jpg',
            width: 360,
            height: 360,
            alt: 'Snarbles Token Platform',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Snarbles - Create Your Own Token in 30 Seconds',
        description: 'Launch your cryptocurrency token instantly with Snarbles. No coding required.',
        images: ['/pSsNHPck_400x400.jpg'],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };

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
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link 
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
              rel="stylesheet" 
            />
            <link rel="icon" href="/favicon2.png" />
            <link rel="apple-touch-icon" href="/favicon2.png" />
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#EF4444" />
            <link rel="dns-prefetch" href="https://api.devnet.solana.com" />
            <link rel="dns-prefetch" href="https://testnet-api.algonode.cloud" />
            <link rel="dns-prefetch" href="https://mainnet-api.algonode.cloud" />
            <link rel="dns-prefetch" href="https://testnet-idx.algonode.cloud" />
            <link rel="dns-prefetch" href="https://mainnet-idx.algonode.cloud" />
          </head>
          <body className="font-inter antialiased bg-background">
            <ServiceWorkerRegistration />
            <SkipToMain />
            <MCPAnalyticsProvider />
            <ChunkErrorBoundary>
              <ClientWalletProvider>
                <WalletAuthProvider>
                  <div className="relative min-h-screen">
                    <NavbarOptimized />
                    <BoltBadge />
                    <main id="main-content" className="pt-16" role="main">
                      {children}
                    </main>
                    <Footer />    
                  </div>
                  <Toaster />
                </WalletAuthProvider>
              </ClientWalletProvider>
            </ChunkErrorBoundary>
          </body>
        </html>
      );
    }