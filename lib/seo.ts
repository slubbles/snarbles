import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  priority?: number
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export interface StructuredDataConfig {
  '@type': string
  name: string
  description: string
  url?: string
  image?: string
  author?: {
    '@type': string
    name: string
  }
  publisher?: {
    '@type': string
    name: string
    logo?: {
      '@type': string
      url: string
    }
  }
  datePublished?: string
  dateModified?: string
  mainEntityOfPage?: string
  breadcrumb?: Array<{
    '@type': string
    name: string
    item: string
  }>
  offers?: {
    '@type': string
    price: string
    priceCurrency: string
    availability: string
  }
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
  }
  faq?: Array<{
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }>
  // Additional properties for WebApplication schema
  applicationCategory?: string
  operatingSystem?: string
  browserRequirements?: string
  featureList?: string[]
  softwareVersion?: string
  downloadUrl?: string
  screenshot?: string[]
}

const BASE_URL = 'https://snarbles.xyz'
const SITE_NAME = 'Snarbles'
const DEFAULT_IMAGE = '/images/snarbles-og-image.png'
const COMPANY_LOGO = '/images/snarbles-logo.png'

export const defaultSEO: SEOConfig = {
  title: 'Snarbles - Professional Token Creation Platform for Algorand & Solana',
  description: 'Create blockchain tokens in under 30 seconds with zero coding required. Professional token creation platform for Algorand and Solana networks with advanced analytics, real-time insights, and comprehensive tokenomics tools.',
  keywords: [
    // Primary keywords (high search volume)
    'token creation platform',
    'create cryptocurrency token',
    'blockchain token generator',
    'algorand token creation',
    'solana token creation',
    'token maker',
    'crypto token builder',
    
    // Secondary keywords (medium search volume)
    'blockchain analytics',
    'cryptocurrency analysis',
    'DeFi analytics',
    'NFT analytics',
    'tokenomics designer',
    'crypto intelligence',
    'blockchain data',
    'Web3 analytics',
    'smart contract analysis',
    'crypto market insights',
    
    // Long-tail keywords (specific intent)
    'how to create a token',
    'token creation tool',
    'professional token development',
    'blockchain token deployment',
    'crypto project launch',
    'token economics modeling',
    'decentralized finance tools',
    'blockchain development platform'
  ],
  image: DEFAULT_IMAGE,
  url: BASE_URL,
  type: 'website',
  author: 'Snarbles Team',
  priority: 1.0,
  changefreq: 'daily'
}

export function generateMetadata(config: Partial<SEOConfig> = {}): Metadata {
  const seo = { ...defaultSEO, ...config }
  const fullUrl = seo.url?.startsWith('http') ? seo.url : `${BASE_URL}${seo.url || ''}`
  const fullImageUrl = seo.image?.startsWith('http') ? seo.image : `${BASE_URL}${seo.image || DEFAULT_IMAGE}`

  const metadata: Metadata = {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords?.join(', '),
    authors: seo.author ? [{ name: seo.author }] : undefined,
    publisher: SITE_NAME,
    creator: SITE_NAME,
    robots: {
      index: !seo.noindex,
      follow: !seo.nofollow,
      googleBot: {
        index: !seo.noindex,
        follow: !seo.nofollow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: fullUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
      locale: 'en_US',
      type: seo.type as any || 'website',
      publishedTime: seo.publishedTime,
      modifiedTime: seo.modifiedTime,
      section: seo.section,
      tags: seo.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [fullImageUrl],
      creator: '@snarbles',
      site: '@snarbles',
    },
    alternates: {
      canonical: seo.canonical || fullUrl,
    },
    other: {
      'theme-color': '#3b82f6',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'application-name': SITE_NAME,
      'apple-mobile-web-app-title': SITE_NAME,
      'format-detection': 'telephone=no',
      'HandheldFriendly': 'True',
      'MobileOptimized': '320',
      'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
      // Security headers that help with SEO
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      // Performance hints
      'dns-prefetch': 'https://fonts.googleapis.com',
      'preconnect': 'https://fonts.gstatic.com',
      'resource-hints': 'preload',
    },
  }

  return metadata
}

export function generateStructuredData(config: StructuredDataConfig): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': config['@type'],
    name: config.name,
    description: config.description,
    url: config.url?.startsWith('http') ? config.url : `${BASE_URL}${config.url || ''}`,
    image: config.image?.startsWith('http') ? config.image : `${BASE_URL}${config.image || DEFAULT_IMAGE}`,
    author: config.author || {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: config.publisher || {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}${COMPANY_LOGO}`,
      },
    },
    datePublished: config.datePublished,
    dateModified: config.dateModified || new Date().toISOString(),
    mainEntityOfPage: config.mainEntityOfPage,
    breadcrumb: config.breadcrumb,
    offers: config.offers,
    aggregateRating: config.aggregateRating,
    faq: config.faq,
  }

  // Remove undefined values
  Object.keys(structuredData).forEach(key => {
    if (structuredData[key as keyof typeof structuredData] === undefined) {
      delete structuredData[key as keyof typeof structuredData]
    }
  })

  return JSON.stringify(structuredData)
}

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Snarbles - Create Blockchain Tokens in Under 30 Seconds | Algorand & Solana',
    description: 'Professional token creation platform for Algorand and Solana networks. Create cryptocurrency tokens with zero coding, advanced analytics, and comprehensive tokenomics tools. Start building your crypto project today.',
    keywords: [
      'token creation platform', 'create cryptocurrency token', 'algorand token creation', 'solana token creation', 
      'blockchain token generator', 'token maker', 'crypto token builder', 'how to create a token',
      'professional token development', 'blockchain token deployment', 'crypto project launch'
    ],
    url: '/',
    priority: 1.0,
    changefreq: 'daily' as const,
  },
  
  create: {
    title: 'Create Token - Professional Blockchain Token Creation | Snarbles',
    description: 'Create your cryptocurrency token in under 30 seconds. Zero coding required. Support for Algorand and Solana networks with advanced features, real-time preview, and professional deployment.',
    keywords: [
      'create token', 'token creation', 'blockchain token generator', 'cryptocurrency token maker',
      'algorand token deployment', 'solana token deployment', 'token builder', 'crypto token creation'
    ],
    url: '/create',
    priority: 0.95,
    changefreq: 'daily' as const,
  },
  
  tokenomics: {
    title: 'Tokenomics Designer & Simulator - Professional Token Economy Modeling | Snarbles',
    description: 'Design and simulate token economies with our advanced tokenomics designer. Create professional reports, visualize token distribution, and model economic scenarios for your crypto project.',
    keywords: [
      'tokenomics designer', 'token economics', 'token distribution', 'tokenomics simulator', 
      'crypto economics', 'token modeling', 'DeFi tokenomics', 'token allocation', 'economic modeling'
    ],
    url: '/tokenomics',
    priority: 0.9,
    changefreq: 'weekly' as const,
  },

  dashboard: {
    title: 'Analytics Dashboard - Real-time Token & Blockchain Data | Snarbles',
    description: 'Comprehensive blockchain analytics dashboard with real-time data, advanced metrics, and AI-powered insights for your created tokens and blockchain projects.',
    keywords: [
      'analytics dashboard', 'blockchain dashboard', 'token analytics', 'crypto analytics', 
      'DeFi metrics', 'real-time crypto data', 'token performance tracking'
    ],
    url: '/dashboard',
    priority: 0.9,
    changefreq: 'hourly' as const,
  },

  about: {
    title: 'About Snarbles - Leading Token Creation & Blockchain Analytics Platform',
    description: 'Learn about Snarbles, the leading platform for professional token creation, blockchain analytics, and comprehensive tokenomics tools. Our mission to democratize blockchain development.',
    keywords: [
      'about snarbles', 'token creation company', 'blockchain development platform', 
      'crypto analytics team', 'blockchain technology solutions'
    ],
    url: '/about',
    priority: 0.8,
    changefreq: 'monthly' as const,
  },

  docs: {
    title: 'Documentation - Token Creation API & Platform Guides | Snarbles',
    description: 'Comprehensive documentation for Snarbles token creation platform, APIs, and tools. Learn how to create tokens, integrate our services, and leverage blockchain analytics.',
    keywords: [
      'token creation API', 'blockchain API documentation', 'tokenomics API', 'crypto development guides',
      'token deployment documentation', 'blockchain integration guides'
    ],
    url: '/docs',
    priority: 0.8,
    changefreq: 'weekly' as const,
  },

  contact: {
    title: 'Contact Snarbles - Get Support for Token Creation & Blockchain Development',
    description: 'Contact Snarbles for token creation support, enterprise blockchain solutions, or technical assistance. Connect with our team of blockchain and crypto experts.',
    keywords: [
      'contact snarbles', 'token creation support', 'blockchain development support', 
      'enterprise crypto solutions', 'technical support'
    ],
    url: '/contact',
    priority: 0.7,
    changefreq: 'monthly' as const,
  },

  enterprise: {
    title: 'Enterprise Token Creation Solutions - White-Label Blockchain Platform | Snarbles',
    description: 'Enterprise-grade token creation and blockchain analytics solutions. White-label platform, custom integrations, and scalable infrastructure for businesses and organizations.',
    keywords: [
      'enterprise token creation', 'white-label blockchain platform', 'enterprise crypto solutions',
      'business blockchain tools', 'institutional token creation', 'blockchain infrastructure'
    ],
    url: '/enterprise',
    priority: 0.8,
    changefreq: 'weekly' as const,
  },

  verify: {
    title: 'Token Verification - Verify & Audit Your Blockchain Tokens | Snarbles',
    description: 'Verify and audit your blockchain tokens with our comprehensive verification system. Security analysis, trust indicators, and public registry for verified tokens.',
    keywords: [
      'token verification', 'token audit', 'blockchain security', 'crypto token verification',
      'smart contract audit', 'token security analysis', 'verified tokens'
    ],
    url: '/verify',
    priority: 0.75,
    changefreq: 'daily' as const,
  }
}

// Industry-specific structured data
export const industryStructuredData = {
  fintech: {
    '@type': 'SoftwareApplication',
    name: 'Snarbles Analytics Platform',
    description: 'Professional blockchain analytics and tokenomics platform for financial technology companies and crypto projects.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 150,
    },
  },

  analytics: {
    '@type': 'WebApplication',
    name: 'Snarbles Blockchain Analytics',
    description: 'Advanced blockchain data analytics and visualization platform with AI-powered insights.',
    applicationCategory: 'BusinessApplication',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    operatingSystem: 'All',
  },

  tokenomics: {
    '@type': 'WebApplication',
    name: 'Tokenomics Designer & Simulator',
    description: 'Professional tokenomics design and simulation tool for cryptocurrency and DeFi projects.',
    applicationCategory: 'BusinessApplication',
    featureList: [
      'Token Distribution Modeling',
      'Economic Scenario Simulation',
      'Professional Report Generation',
      'Interactive Visualizations',
      'PDF Export Capabilities',
    ],
  },
}

// FAQ structured data for common questions
export const faqStructuredData = {
  '@type': 'FAQPage',
  name: 'Snarbles Token Creation Platform - Frequently Asked Questions',
  description: 'Common questions about Snarbles professional token creation platform',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I create a token on Snarbles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Creating a token on Snarbles takes under 30 seconds. Simply connect your wallet, choose your blockchain (Algorand or Solana), fill in your token details like name and symbol, and deploy. No coding required - our platform handles all the technical complexity.',
      },
    },
    {
      '@type': 'Question',
      name: 'What blockchains does Snarbles support for token creation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Snarbles currently supports token creation on Algorand (mainnet and testnet) and Solana (devnet) networks. We provide native integration with popular wallets like Pera Wallet for Algorand and Phantom for Solana.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does it cost to create a token?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Token creation costs vary by network. On Algorand, it typically costs around 5 ALGO plus network fees. You can also purchase credits with ALGO or USDT for convenient payment. Enterprise pricing is available for bulk token creation.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I create tokens without coding knowledge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Snarbles is designed for users with no coding experience. Our intuitive interface guides you through the token creation process with real-time preview, form validation, and automated deployment to the blockchain.',
      },
    },
    {
      '@type': 'Question',
      name: 'What features can I add to my token?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can configure various token features including custom supply, decimals, mintable/burnable options, pausable functionality, and rich metadata with logos, descriptions, and social links.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I get analytics for my created tokens?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Snarbles provides comprehensive analytics dashboard with real-time token performance, holder analytics, transaction history, and market insights for all tokens created on our platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there enterprise support for businesses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer enterprise solutions including white-label platforms, custom integrations, bulk token creation, dedicated support, and API access for businesses and organizations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the tokenomics designer work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our tokenomics designer allows you to model token economies, simulate distribution scenarios, analyze economic parameters, and generate professional reports with interactive visualizations and PDF exports.',
      },
    },
  ],
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>): string {
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${BASE_URL}${crumb.url}`,
    })),
  }

  return JSON.stringify(breadcrumbList)
}
