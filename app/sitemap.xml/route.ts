import { NextRequest, NextResponse } from 'next/server'
import { pageSEO } from '@/lib/seo'

// Dynamic sitemap generation for better SEO
export async function GET(request: NextRequest) {
  const baseUrl = 'https://snarbles.xyz'
  
  // Core pages with their SEO configurations
  const staticPages = Object.entries(pageSEO).map(([key, config]) => ({
    url: `${baseUrl}${config.url}`,
    lastModified: new Date(),
    changeFrequency: config.changefreq,
    priority: config.priority,
  }))

  // Additional pages that might not be in pageSEO
  const additionalPages = [
    {
      url: `${baseUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/enterprise`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/affiliates`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/revenue`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]

  const allPages = [...staticPages, ...additionalPages]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified.toISOString()}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
    <image:image>
      <image:loc>${baseUrl}/images/snarbles-og-image.png</image:loc>
      <image:title>Snarbles - ${page.url.split('/').pop() || 'Home'}</image:title>
      <image:caption>Blockchain analytics and tokenomics platform</image:caption>
    </image:image>
  </url>`
    )
    .join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  })
}
