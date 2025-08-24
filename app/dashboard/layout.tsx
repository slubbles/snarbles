import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata, pageSEO, generateStructuredData, industryStructuredData } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(pageSEO.dashboard)

// Generate structured data for the dashboard page
const structuredData = generateStructuredData({
  ...industryStructuredData.analytics,
  url: '/dashboard',
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      {children}
    </>
  )
}
