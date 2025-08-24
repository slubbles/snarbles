import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata, pageSEO, generateStructuredData, industryStructuredData } from '@/lib/seo'
import TokenomicsDesigner from './TokenomicsDesigner'

export const metadata: Metadata = generateSEOMetadata(pageSEO.tokenomics)

// Generate structured data for the tokenomics page
const structuredData = generateStructuredData({
  ...industryStructuredData.tokenomics,
  url: '/tokenomics',
})

export default function TokenomicsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <TokenomicsDesigner />
    </>
  )
}
