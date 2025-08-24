import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const robotsTxt = `# Robots.txt for Snarbles.xyz - Enhanced SEO Configuration
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# High-priority pages for crawlers
Allow: /
Allow: /tokenomics
Allow: /dashboard
Allow: /analytics
Allow: /about
Allow: /docs
Allow: /contact

# Block sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /auth/
Disallow: /profile/
Disallow: /test*
Disallow: /mobile-test/
Disallow: /*.json$
Disallow: /*?*
Disallow: /search?

# Allow important API endpoints for SEO
Allow: /api/sitemap
Allow: /api/robots
Allow: /api/manifest

# Block common bot traps
Disallow: /trap/
Disallow: /honeypot/
Disallow: /spam/

# Specific bot configurations
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 3

User-agent: YandexBot
Allow: /
Crawl-delay: 2

# Social media crawlers
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /

# Block aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MajesticSEO
Crawl-delay: 10

# Sitemap location
Sitemap: https://snarbles.xyz/sitemap.xml
Sitemap: https://snarbles.xyz/api/sitemap

# Host directive (helps with canonicalization)
Host: https://snarbles.xyz

# Cache directive for robots.txt itself
# This file should be cached for 24 hours
Cache-Control: public, max-age=86400`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
