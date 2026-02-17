'use client'

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    const runTests = async () => {
      const results: any = {}
      
      // Test 1: Check environment variables in browser
      results.clientEnv = {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
      
      // Test 2: Test API endpoint
      try {
        const envTest = await fetch('/api/test')
        results.apiTest = await envTest.json()
      } catch (e) {
        results.apiTest = { error: String(e) }
      }
      
      // Test 3: Test Supabase import on server
      try {
        const supabaseTest = await fetch('/api/test-supabase')
        results.supabaseTest = await supabaseTest.json()
      } catch (e) {
        results.supabaseTest = { error: String(e) }
      }
      
      setTestResults(results)
    }
    
    runTests()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">System Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(testResults, null, 2)}
      </pre>
      
      <div className="mt-4 space-x-4">
        <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        <a href="/auth/callback?code=test" className="text-blue-600 hover:underline">Test Callback</a>
      </div>
    </div>
  )
}