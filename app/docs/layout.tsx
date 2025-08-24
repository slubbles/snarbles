import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, pageSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(pageSEO.docs);

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
