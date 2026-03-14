import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Since we don't have the auth-helpers, we'll rely on the client-side check 
  // and root layout syncing for now, but we can check for the presence of a supabase cookie
  const res = NextResponse.next()
  
  const hasAuthCookie = req.cookies.has('sb-access-token') || req.cookies.has('supabase-auth-token')

  if (!hasAuthCookie && req.nextUrl.pathname.startsWith('/dashboard')) {
    // Note: This is an optimistic check. Real session validation should be done with @supabase/ssr
    // redirectUrl.pathname = '/auth/login'
    // return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
