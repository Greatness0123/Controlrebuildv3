import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {

  const res = NextResponse.next()
  
  const hasAuthCookie = req.cookies.has('sb-access-token') || req.cookies.has('supabase-auth-token')

  if (!hasAuthCookie && req.nextUrl.pathname.startsWith('/dashboard')) {

  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
