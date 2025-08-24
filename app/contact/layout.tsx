import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(pageSEO.contact)

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
