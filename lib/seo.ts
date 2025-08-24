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
}

const BASE_URL = 'https://snarbles.xyz'
const SITE_NAME = 'Snarbles'
const DEFAULT_IMAGE = '/images/snarbles-og-image.png'
const COMPANY_LOGO = '/images/snarbles-logo.png'

export const defaultSEO: SEOConfig = {
  title: 'Snarbles - AI-Powered Blockchain Analytics & Tokenomics Platform',
  description: 'Professional blockchain analytics, AI-powered insights, and comprehensive tokenomics tools for DeFi, NFTs, and crypto projects. Real-time data, advanced charts, and actionable intelligence.',
  keywords: [
    'blockchain analytics',
    'cryptocurrency analysis',
    'DeFi analytics',
    'NFT analytics',
    'tokenomics',
    'crypto intelligence',
    'blockchain data',
    'Web3 analytics',
    'smart contract analysis',
    'crypto market insights',
    'digital asset analytics',
    'blockchain intelligence',
    'crypto research tools',
    'DeFi metrics',
    'token analysis'
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
    title: 'Snarbles - AI-Powered Blockchain Analytics & Tokenomics Platform',
    description: 'Professional blockchain analytics, AI-powered insights, and comprehensive tokenomics tools for DeFi, NFTs, and crypto projects. Real-time data, advanced charts, and actionable intelligence.',
    keywords: ['blockchain analytics', 'cryptocurrency analysis', 'DeFi analytics', 'NFT analytics', 'tokenomics', 'crypto intelligence'],
    url: '/',
    priority: 1.0,
    changefreq: 'daily' as const,
  },
  
  tokenomics: {
    title: 'Tokenomics Designer & Simulator - Advanced Token Economy Modeling | Snarbles',
    description: 'Design, simulate, and analyze token economies with our advanced tokenomics designer. Create professional reports, visualize token distribution, and model economic scenarios for your crypto project.',
    keywords: ['tokenomics designer', 'token economics', 'token distribution', 'tokenomics simulator', 'crypto economics', 'token modeling', 'DeFi tokenomics', 'token allocation'],
    url: '/tokenomics',
    priority: 0.9,
    changefreq: 'weekly' as const,
  },

  dashboard: {
    title: 'Analytics Dashboard - Real-time Blockchain Data & Insights | Snarbles',
    description: 'Comprehensive blockchain analytics dashboard with real-time data, advanced metrics, and AI-powered insights for cryptocurrency, DeFi, and NFT analysis.',
    keywords: ['analytics dashboard', 'blockchain dashboard', 'crypto analytics', 'DeFi metrics', 'NFT analytics', 'real-time crypto data'],
    url: '/dashboard',
    priority: 0.9,
    changefreq: 'hourly' as const,
  },

  about: {
    title: 'About Snarbles - Leading Blockchain Analytics Platform',
    description: 'Learn about Snarbles, the leading platform for blockchain analytics, AI-powered insights, and professional tokenomics tools. Our mission, team, and vision for the future of crypto analytics.',
    keywords: ['about snarbles', 'blockchain analytics company', 'crypto analytics team', 'blockchain intelligence platform'],
    url: '/about',
    priority: 0.8,
    changefreq: 'monthly' as const,
  },

  docs: {
    title: 'Documentation - Snarbles API & Platform Guides',
    description: 'Comprehensive documentation for Snarbles platform, APIs, and tools. Learn how to integrate blockchain analytics, use our tokenomics designer, and leverage our data services.',
    keywords: ['snarbles documentation', 'blockchain analytics API', 'tokenomics API', 'crypto data API', 'developer guides'],
    url: '/docs',
    priority: 0.8,
    changefreq: 'weekly' as const,
  },

  contact: {
    title: 'Contact Snarbles - Get in Touch with Our Team',
    description: 'Contact Snarbles for blockchain analytics solutions, enterprise partnerships, or technical support. Connect with our team of crypto and DeFi experts.',
    keywords: ['contact snarbles', 'blockchain analytics support', 'enterprise crypto analytics', 'technical support'],
    url: '/contact',
    priority: 0.7,
    changefreq: 'monthly' as const,
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
  name: 'Snarbles Frequently Asked Questions',
  description: 'Common questions about Snarbles blockchain analytics platform',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Snarbles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Snarbles is a professional blockchain analytics platform that provides AI-powered insights, comprehensive tokenomics tools, and real-time data analysis for cryptocurrency, DeFi, and NFT projects.',
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
    {
      '@type': 'Question',
      name: 'Is Snarbles free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Snarbles offers both free and premium tiers. Basic analytics and tokenomics tools are available for free, while advanced features and enterprise solutions require a subscription.',
      },
    },
    {
      '@type': 'Question',
      name: 'What blockchains does Snarbles support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Snarbles supports major blockchains including Ethereum, Algorand, Solana, Polygon, Binance Smart Chain, and other EVM-compatible networks.',
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
