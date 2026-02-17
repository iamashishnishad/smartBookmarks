# Smart Bookmark App

A bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can sign in with Google, add/delete bookmarks, and see real-time updates across multiple tabs.

## Features

- 🔐 Google OAuth authentication
- 📑 Add bookmarks with title and URL
- 🗑️ Delete bookmarks
- 🔄 Real-time updates across multiple tabs
- 👤 Private bookmarks per user
- 🎨 Clean, responsive UI with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Supabase Auth (Google OAuth)
- **Database:** Supabase PostgreSQL
- **Real-time:** Supabase Realtime
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Challenges Faced & Solutions

### 1. Real-time Subscriptions with User Filtering
**Problem:** Setting up real-time subscriptions that only show bookmarks for the current user was tricky because the subscription needed the user ID, which wasn't available when the component first mounted.

**Solution:** Used a filter in the Supabase channel subscription with `user_id=eq.${user?.id}` and managed the subscription lifecycle properly by cleaning up when the component unmounts or user changes.

### 2. Google OAuth Redirects
**Problem:** After Google sign-in, users weren't being properly redirected back to the app with the correct session.

**Solution:** Created a dedicated auth callback route that exchanges the OAuth code for a session and redirects to the home page. Also configured the redirect URL in Supabase dashboard to point to the callback endpoint.

### 3. Row Level Security (RLS) Policies
**Problem:** Initially, bookmarks weren't showing up because RLS policies weren't properly configured.

**Solution:** Created comprehensive RLS policies for SELECT, INSERT, and DELETE operations, ensuring each user can only access their own bookmarks using `auth.uid() = user_id`.

### 4. URL Validation
**Problem:** Users could enter invalid URLs that would break the bookmark links.

**Solution:** Added URL validation using the built-in URL constructor, with helpful error messages prompting users to include http:// or https://.

### 5. Real-time Updates After Delete
**Problem:** When deleting a bookmark, the UI wouldn't always update immediately.

**Solution:** Used the Supabase Realtime subscription to listen for DELETE events and update the local state accordingly. Also implemented optimistic UI updates for better user experience.

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-bookmark-app.git
cd smart-bookmark-app