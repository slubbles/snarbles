import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(pageSEO.about)

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
