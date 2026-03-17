-- ==============================================================================
-- 1. SYNC SETUP: Create 'user_data' table
--    This table stores user settings and app state (like calendar, notes, etc.)
--    so they persist across devices.
-- ==============================================================================

-- Create 'user_data' table only if it doesn't exist
create table if not exists public.user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, key)
);

-- Enable Row Level Security (RLS)
alter table public.user_data enable row level security;

-- Create Policy: Users can only access their own data
-- (Safe Mode: drops old policy first to avoid errors if re-running)
do $$ 
begin
  if not exists (
    select from pg_policies where tablename = 'user_data' and policyname = 'Users can perform all actions on their own data'
  ) then
    create policy "Users can perform all actions on their own data"
    on public.user_data for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

-- Create Index for faster lookups by user and key
create index if not exists idx_user_data_user_key on public.user_data(user_id, key);


-- ==============================================================================
-- 2. COLLABORATION SETUP: Create 'boards' table
--    This table stores the Excalidraw whiteboard sessions.
-- ==============================================================================

create table if not exists public.boards (
  id uuid default gen_random_uuid() primary key,
  name text default 'Untitled',
  elements jsonb default '[]'::jsonb,
  app_state jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for boards (Optional: adjust based on sharing needs)
alter table public.boards enable row level security;

-- Policy: Anyone can read/write boards (for collaboration)
-- You might want to restrict this to authenticated users in production
do $$ 
begin
  if not exists (
    select from pg_policies where tablename = 'boards' and policyname = 'Public access to boards'
  ) then
    create policy "Public access to boards"
    on public.boards for all
    using (true)
    with check (true);
  end if;
end $$;


-- ==============================================================================
-- 3. CRITICAL FIX: Disable Realtime for 'boards' table
--    We use WebSocket Broadcasts for collaboration (client-to-client).
--    If this is ON, the database sends every save back to the sender, 
--    causing an echo/flicker loop.
-- ==============================================================================

do $$ 
begin 
  -- Check if 'boards' table is currently in the publication
  if exists ( 
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'boards' 
  ) then 
    -- Remove it from realtime (we handle sync manually in the code)
    alter publication supabase_realtime drop table boards; 
  end if; 
end; 
$$;
