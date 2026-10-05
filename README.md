# Studyloop

A LeetCode study dashboard with deterministic spaced repetition, pattern analytics, public-profile import, and optional Supabase sync.

## Run locally

```bash
npm install
npm run dev
```

The app starts in demo mode and saves to this browser. To enable accounts and cloud sync:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable GitHub in Supabase Authentication → Providers and add the callback URL Supabase shows to your GitHub OAuth app.
3. Copy `.env.example` to `.env.local` and add the project URL and anon key.
4. Add your local and deployed origins to Supabase Authentication → URL Configuration.

## Deploy to Vercel

Import this directory into Vercel, add the two environment variables from `.env.example`, and deploy. The LeetCode import runs through `/api/leetcode`, so browser CORS restrictions do not apply.

## Review algorithm

The schedule is intentionally deterministic. New misses start at 1 day; clean first attempts start at 3 days. Review grades move through fixed intervals of 1, 3, 7, 14, 30, and 60 days: Hard resets to 1 day, Good advances one step, and Easy advances two.
