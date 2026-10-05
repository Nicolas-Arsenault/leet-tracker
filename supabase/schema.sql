-- Run in Supabase SQL editor, then enable GitHub in Authentication > Providers.
create table if not exists public.problems (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  pattern text not null,
  first_attempt boolean not null default false,
  notes text not null default '',
  solved_at timestamptz not null default now(),
  next_review timestamptz not null,
  review_stage integer not null default 0,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
alter table public.problems enable row level security;
create policy "Users can read their problems" on public.problems for select using (auth.uid() = user_id);
create policy "Users can insert their problems" on public.problems for insert with check (auth.uid() = user_id);
create policy "Users can update their problems" on public.problems for update using (auth.uid() = user_id);
create policy "Users can delete their problems" on public.problems for delete using (auth.uid() = user_id);
create index if not exists problems_user_review_idx on public.problems(user_id,next_review);
create index if not exists problems_user_pattern_idx on public.problems(user_id,pattern);
