import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only allow homepage during countdown
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, gifs, etc.)
     */
    '/((?!_next/static|_next/image|favicon|.*\\.(?:gif|jpg|jpeg|png|webp|svg|ico)).*)',
  ],
}
