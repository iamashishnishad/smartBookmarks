'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Bookmark } from '@/types/database'
import { RealtimeChannel } from '@supabase/supabase-js'

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  const fetchBookmarks = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookmarks(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }
        
        setUser(user)
        await fetchBookmarks(user.id)
        
        // Clean up existing subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }

        // Set up real-time subscription with proper event handling
        const subscription = supabase
          .channel(`bookmarks-${user.id}`)
          .on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'bookmarks',
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              console.log('INSERT event received:', payload)
              setBookmarks((prev) => {
                // Check if bookmark already exists to avoid duplicates
                const exists = prev.some(b => b.id === payload.new.id)
                if (exists) return prev
                return [payload.new as Bookmark, ...prev]
              })
            }
          )
          .on(
            'postgres_changes',
            { 
              event: 'DELETE', 
              schema: 'public', 
              table: 'bookmarks',
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              console.log('DELETE event received:', payload)
              setBookmarks((prev) => {
                const newBookmarks = prev.filter(
                  (bookmark) => bookmark.id !== payload.old.id
                )
                console.log('Bookmarks after delete:', newBookmarks.length)
                return newBookmarks
              })
            }
          )
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'bookmarks',
              filter: `user_id=eq.${user.id}` 
            },
            (payload) => {
              console.log('UPDATE event received:', payload)
              setBookmarks((prev) =>
                prev.map((bookmark) =>
                  bookmark.id === payload.new.id ? (payload.new as Bookmark) : bookmark
                )
              )
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
          })

        subscriptionRef.current = subscription

        return () => {
          console.log('Cleaning up subscription')
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe()
          }
        }
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize')
        setLoading(false)
      }
    }

    initialize()
  }, [supabase, router, fetchBookmarks])

  const handleSignOut = async () => {
    // Clean up subscription before signing out
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newBookmark.title.trim() || !newBookmark.url.trim()) {
      setError('Title and URL are required')
      return
    }

    if (!validateUrl(newBookmark.url)) {
      setError('Please enter a valid URL (include http:// or https://)')
      return
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert([
          {
            title: newBookmark.title,
            url: newBookmark.url,
            user_id: user.id,
          },
        ])

      if (error) throw error
      
      setNewBookmark({ title: '', url: '' })
      setIsFormVisible(false)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const deleteBookmark = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      try {
        // Optimistically update UI
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
        
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', id)

        if (error) {
          // Revert on error
          await fetchBookmarks(user.id)
          throw error
        }
      } catch (error: any) {
        setError(error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h1 className="text-xl font-light tracking-tight text-black">
                Smart<span className="font-medium">Bookmarks</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black border border-gray-300 rounded-md hover:border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="mb-8 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-black">{bookmarks.length}</span> bookmarks saved
          </div>
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isFormVisible ? 'Cancel' : 'Add Bookmark'}
          </button>
        </div>

        {/* Add Bookmark Form */}
        {isFormVisible && (
          <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6 animate-fadeIn">
            <h2 className="text-lg font-medium text-black mb-4">Add New Bookmark</h2>
            <form onSubmit={addBookmark} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., GitHub"
                  />
                </div>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="https://github.com"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black border border-gray-300 rounded hover:border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bookmarks Grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-black">No bookmarks yet</h3>
            <p className="mt-2 text-sm text-gray-600">Get started by adding your first bookmark.</p>
            <button
              onClick={() => setIsFormVisible(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Bookmark
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group relative bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-black truncate mb-1">
                        {bookmark.title}
                      </h3>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-black truncate block transition-colors"
                      >
                        {bookmark.url.replace(/^https?:\/\//, '')}
                      </a>
                      <p className="text-xs text-gray-400 mt-2">
                        Added {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="opacity-0 group-hover:opacity-100 ml-4 p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded transition-all"
                      title="Delete bookmark"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dev Tools - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50">
          Bookmarks: {bookmarks.length}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}