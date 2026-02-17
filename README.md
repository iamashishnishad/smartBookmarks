# Smart Bookmark App 🔖

🔗 **Live Demo**: [https://smart-bookmarks-rose.vercel.app](https://smart-bookmarks-rose.vercel.app)

A modern, real-time bookmark manager built with Next.js 14, Supabase, and Tailwind CSS. Users can sign in with Google, add/delete bookmarks, and see updates instantly across multiple tabs.


## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google (no email/password)
- 📑 **Add Bookmarks** - Save URLs with custom titles
- 🗑️ **Delete Bookmarks** - Remove bookmarks with confirmation dialog
- 🔄 **Real-time Updates** - Changes appear instantly across all open tabs
- 👤 **Private Bookmarks** - Each user sees ONLY their own bookmarks (RLS enforced)
- 🎨 **Professional Design** - Clean black and white interface with smooth animations
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Optimistic UI** - Instant feedback with automatic error recovery

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** or **pnpm**
- **Git**

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/iamashishnishad/smartBookmarks.git
   cd smartBookmarks


 2.  Install dependencies

 npm install
# or
yarn install
# or
pnpm install

3. Set up environment variables

Create a .env.local file in the root directory:

NEXT_PUBLIC_SUPABASE_URL=https://zuauvwyxvqpjyqrftrht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

4. Run the development server

npm run dev
# or
yarn dev
# or
pnpm dev



1. What I struggled with

Google OAuth Redirect Mismatch

The Problem:  Error 400: redirect_uri_mismatch

Google was trying to redirect to https://myproject.supabase.co/auth/v1/callback, but this URL wasn't registered.

Why it was tricky:
I didn't realize Supabase acts as an intermediary. The OAuth flow is: Google → Supabase → My App. So I needed to register Supabase's callback URL in Google Cloud Console, not just my app's URL.

The Fix:
In Google Cloud Console → Credentials → Authorized Redirect URIs, I added:

https://zuauvwyxvqpjyqrftrht.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://smart-bookmarks-rose.vercel.app/auth/callback


2. Real-time DELETE Not Working

The Problem:
INSERT events worked perfectly - new bookmarks appeared instantly across tabs. But DELETE events did nothing until page refresh.

Why it was tricky:
I was using a single wildcard event handler for all changes. The DELETE payload structure is different from INSERT, and my state update logic wasn't handling it correctly.

The Fix:


.on('postgres_changes', 
  { event: '*', schema: 'public', table: 'bookmarks' },
  (payload) => {
    // One handler for all events - couldn't distinguish DELETE properly
  }
)


.on('postgres_changes', 
  { event: 'INSERT', schema: 'public', table: 'bookmarks' },
  (payload) => {
    setBookmarks(prev => [payload.new, ...prev])
  }
)
.on('postgres_changes',
  { event: 'DELETE', schema: 'public', table: 'bookmarks' },
  (payload) => {
    // payload.old contains the deleted bookmark
    setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
  }
)
