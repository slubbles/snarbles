import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata, pageSEO, generateStructuredData, industryStructuredData } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(pageSEO.tokenomics)

// Generate structured data for the tokenomics page
const structuredData = generateStructuredData({
  ...industryStructuredData.tokenomics,
  url: '/tokenomics',
})

export default function TokenomicsLayout({
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
