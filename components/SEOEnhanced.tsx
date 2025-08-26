import Head from 'next/head'
import { generateStructuredData } from '@/lib/seo'

interface SEOEnhancedProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  publishedTime?: string
  modifiedTime?: string
  structuredData?: any
  noindex?: boolean
  nofollow?: boolean
}

export default function SEOEnhanced({
  title,
  description,
  keywords = [],
  image = '/images/snarbles-og-image.png',
  url = '',
  type = 'website',
  publishedTime,
  modifiedTime,
  structuredData,
  noindex = false,
  nofollow = false
}: SEOEnhancedProps) {
  const baseUrl = 'https://snarbles.xyz'
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Snarbles" />
      <meta property="og:locale" content="en_US" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />
      <meta property="twitter:creator" content="@snarbles" />
      <meta property="twitter:site" content="@snarbles" />

      {/* Robots */}
      <meta 
        name="robots" 
        content={`${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`} 
      />
      <meta 
        name="googlebot" 
        content={`${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`} 
      />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Snarbles Team" />
      <meta name="publisher" content="Snarbles" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: typeof structuredData === 'string' ? structuredData : JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  )
}

// Specific page components
export function TokenCreationPageSEO() {
  const structuredData = generateStructuredData({
    '@type': 'WebApplication',
    name: 'Snarbles Token Creator',
    description: 'Professional token creation tool for Algorand and Solana blockchains',
    url: 'https://snarbles.xyz/create',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '5',
      priceCurrency: 'ALGO',
      availability: 'https://schema.org/InStock',
    },
  })

  return (
    <SEOEnhanced
      title="Create Token - Professional Blockchain Token Creation | Snarbles"
      description="Create your cryptocurrency token in under 30 seconds. Zero coding required. Support for Algorand and Solana networks with advanced features and real-time preview."
      keywords={[
        'create token', 'token creation', 'blockchain token generator', 'cryptocurrency token maker',
        'algorand token deployment', 'solana token deployment', 'token builder', 'crypto token creation',
        'how to create cryptocurrency', 'token development tool', 'blockchain development platform'
      ]}
      url="/create"
      type="website"
      structuredData={structuredData}
    />
  )
}

export function TokenomicsPageSEO() {
  const structuredData = generateStructuredData({
    '@type': 'WebApplication',
    name: 'Snarbles Tokenomics Designer',
    description: 'Advanced tokenomics design and simulation tool for cryptocurrency projects',
    url: 'https://snarbles.xyz/tokenomics',
    applicationCategory: 'BusinessApplication',
    featureList: [
      'Token Distribution Modeling',
      'Economic Scenario Simulation',
      'Professional Report Generation',
      'Interactive Visualizations',
      'PDF Export Capabilities',
    ],
  })

  return (
    <SEOEnhanced
      title="Tokenomics Designer & Simulator - Professional Token Economy Modeling | Snarbles"
      description="Design and simulate token economies with our advanced tokenomics designer. Create professional reports, visualize token distribution, and model economic scenarios."
      keywords={[
        'tokenomics designer', 'token economics', 'token distribution', 'tokenomics simulator',
        'crypto economics', 'token modeling', 'DeFi tokenomics', 'token allocation', 'economic modeling',
        'token economy design', 'cryptocurrency economics', 'token distribution strategy'
      ]}
      url="/tokenomics"
      type="website"
      structuredData={structuredData}
    />
  )
}

export function DashboardPageSEO() {
  const structuredData = generateStructuredData({
    '@type': 'WebApplication',
    name: 'Snarbles Analytics Dashboard',
    description: 'Real-time blockchain analytics and token performance tracking dashboard',
    url: 'https://snarbles.xyz/dashboard',
    applicationCategory: 'BusinessApplication',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
  })

  return (
    <SEOEnhanced
      title="Analytics Dashboard - Real-time Token & Blockchain Data | Snarbles"
      description="Comprehensive blockchain analytics dashboard with real-time data, advanced metrics, and AI-powered insights for your created tokens and blockchain projects."
      keywords={[
        'analytics dashboard', 'blockchain dashboard', 'token analytics', 'crypto analytics',
        'DeFi metrics', 'real-time crypto data', 'token performance tracking', 'blockchain metrics',
        'cryptocurrency dashboard', 'token management dashboard'
      ]}
      url="/dashboard"
      type="website"
      structuredData={structuredData}
    />
  )
}
