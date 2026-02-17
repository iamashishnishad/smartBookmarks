import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if we can import supabase
    const { createClient } = await import('@/utils/supabase/server')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase import successful',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : null,
    }, { status: 500 })
  }
}