# SolveLoop

A LeetCode solve log with pattern analytics, issue-driven spaced re-solving, profile import, and optional Supabase sync.

## Run locally

```bash
npm install
npm run dev
```

The app starts in demo mode and saves to this browser. To enable accounts and cloud sync:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Enable GitHub in Supabase Authentication → Providers and add the callback URL Supabase shows to your GitHub OAuth app.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
4. Add your local and deployed origins to Supabase Authentication → URL Configuration.

## Private owner access

SolveLoop uses Supabase GitHub OAuth and a server-side email allowlist. Add `OWNER_EMAIL` to `.env.local` and to the Vercel project, using the email returned by the one GitHub account that should have access. Production returns a locked configuration response if any required auth variable is missing.

Add these redirect URLs in Supabase Authentication → URL Configuration:

- `http://localhost:5173/auth/callback`
- `https://YOUR-VERCEL-DOMAIN/auth/callback`

The GitHub OAuth application's callback remains the Supabase callback URL shown under Authentication → Providers → GitHub.

## LeetCode import

LeetCode's public profile API provides exact solved totals and topic counts, but only the latest 20 accepted problem names. SolveLoop always imports those complete aggregate analytics.

For a full title-by-title crawl while running locally, add `LEETCODE_SESSION` and `LEETCODE_CSRF_TOKEN` to `.env.local`. They are sent only from the server to LeetCode and must never use the `NEXT_PUBLIC_` prefix. The authenticated LeetCode account must match the profile being imported. Restart the local server after adding them.

## Deploy to Vercel

Import this directory into Vercel, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `OWNER_EMAIL`, then deploy. The route proxy protects the dashboard and API routes before rendering, and Supabase row-level security isolates the stored records. The LeetCode import runs through `/api/leetcode`, so browser CORS restrictions do not apply.

## Review algorithm

The schedule is intentionally deterministic and applies only to problems marked as difficult. They move through fixed intervals of 1, 3, 7, 14, 30, and 60 days: Still stuck resets to 1 day, Solved advances one step, and Easy now advances two. Clean solves and imported problems do not enter the queue automatically.
