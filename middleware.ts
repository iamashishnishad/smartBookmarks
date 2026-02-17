import { createClient } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()

    const pathname = request.nextUrl.pathname
    
    // Define routes
    const isAuthRoute = pathname === '/login'
    const isCallbackRoute = pathname === '/auth/callback'
    const isHomeRoute = pathname === '/'
    
    // Allow callback route to work without session
    if (isCallbackRoute) {
      return response
    }
    
    // Redirect to login if no session and trying to access home
    if (isHomeRoute && !session) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect to home if logged in and trying to access login
    if (isAuthRoute && session) {
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/', '/login', '/auth/callback'],
}