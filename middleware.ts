import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const publicPaths = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/confirm']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon') || pathname.startsWith('/apple-touch-icon') || pathname.startsWith('/manifest')) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  console.log(`[MIDDLEWARE] Ruta: ${pathname}, User: ${user ? user.email : 'NO AUTENTICADO'}`)

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|apple-touch-icon.png|sw.js|workbox-.*).*)',
  ],
}
