import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | Snarbles Platform',
  description: 'Official documentation and whitepaper for Snarbles - the future of no-code blockchain development. Multi-chain token creation, NFT generation, and decentralized ecosystem building.',
  keywords: [
    'snarbles',
    'documentation',
    'whitepaper',
    'blockchain',
    'no-code',
    'token creation',
    'NFT',
    'algorand',
    'solana',
    'cryptocurrency',
    'decentralized',
    'platform'
  ],
  authors: [{ name: 'Snarbles Team' }],
  creator: 'Snarbles Platform',
  publisher: 'Snarbles',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Snarbles Platform Documentation',
    description: 'The future of no-code blockchain development. Multi-chain token creation, NFT generation, and decentralized ecosystem building.',
    url: 'https://snarbles.xyz/docs',
    siteName: 'Snarbles',
    images: [
      {
        url: 'https://snarbles.xyz/og-docs.png',
        width: 1200,
        height: 630,
        alt: 'Snarbles Platform Documentation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snarbles Platform Documentation',
    description: 'The future of no-code blockchain development. Multi-chain token creation and ecosystem building.',
    images: ['https://snarbles.xyz/og-docs.png'],
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
  verification: {
    google: 'verification-token',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
