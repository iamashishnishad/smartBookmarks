import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    console.log('Auth callback - Code received:', code ? 'yes' : 'no')

    if (code) {
      const supabase = await createClient()
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback - Error exchanging code:', error)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
        )
      }
      
      console.log('Auth callback - Successfully exchanged code for session')
    }

    // Redirect to home page
    return NextResponse.redirect(new URL('/', origin))
  } catch (error) {
    console.error('Auth callback - Unexpected error:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL('/login?error=Authentication failed', requestUrl.origin)
    )
  }
}