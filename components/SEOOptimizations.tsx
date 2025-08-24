import Script from 'next/script'

export function PerformanceOptimizations() {
  return (
    <>
      {/* Google Analytics with enhanced privacy */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href,
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>

      {/* Core Web Vitals monitoring */}
      <Script id="web-vitals" strategy="afterInteractive">
        {`
          function sendToAnalytics(metric) {
            gtag('event', metric.name, {
              event_category: 'Web Vitals',
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              event_label: metric.id,
              non_interaction: true,
            });
          }

          // Dynamically import web-vitals
          import('https://unpkg.com/web-vitals@3/dist/web-vitals.js')
            .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
              getCLS(sendToAnalytics);
              getFID(sendToAnalytics);
              getFCP(sendToAnalytics);
              getLCP(sendToAnalytics);
              getTTFB(sendToAnalytics);
            });
        `}
      </Script>

      {/* Resource hints for critical resources */}
      <link rel="preload" href="/images/snarbles-og-image.png" as="image" />
      <link rel="preload" href="/images/snarbles-logo.png" as="image" />
      
      {/* Preconnect to external services */}
      <link rel="preconnect" href="https://api.algorand.com" />
      <link rel="preconnect" href="https://mainnet-api.algonode.cloud" />
      <link rel="preconnect" href="https://api.solana.com" />
      <link rel="preconnect" href="https://api.coingecko.com" />
    </>
  )
}

export function SEOSchemas() {
  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Snarbles",
    "url": "https://snarbles.xyz",
    "logo": "https://snarbles.xyz/images/snarbles-logo.png",
    "description": "AI-Powered Blockchain Analytics & Tokenomics Platform",
    "sameAs": [
      "https://twitter.com/snarbles",
      "https://github.com/snarbles",
      "https://linkedin.com/company/snarbles"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://snarbles.xyz/contact"
    }
  }

  // WebApplication schema
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Snarbles Analytics Platform",
    "description": "Professional blockchain analytics, AI insights, and comprehensive tokenomics tools",
    "url": "https://snarbles.xyz",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "Blockchain Analytics",
      "Tokenomics Design",
      "DeFi Analytics",
      "NFT Analytics", 
      "AI-Powered Insights",
      "Real-time Data",
      "Professional Reports"
    ]
  }

  // BreadcrumbList for homepage
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://snarbles.xyz"
    }]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}
