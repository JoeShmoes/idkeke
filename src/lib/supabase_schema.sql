-- 1. Create the 'boards' table (Safe if exists)
create table if not exists boards (
  id uuid default gen_random_uuid() primary key,
  name text default 'Untitled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  elements jsonb default '[]'::jsonb,
  app_state jsonb default '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
alter table boards enable row level security;

-- 3. Safely Re-create Access Policies
-- We drop them first to ensure we don't get "policy already exists" errors
drop policy if exists "Allow public read access" on boards;
drop policy if exists "Allow public insert access" on boards;
drop policy if exists "Allow public update access" on boards;

create policy "Allow public read access"
  on boards for select
  using (true);

create policy "Allow public insert access"
  on boards for insert
  with check (true);

create policy "Allow public update access"
  on boards for update
  using (true);

-- 4. Realtime Configuration
-- CRITICAL: Disable Realtime for 'boards' table to prevent "Echo" and flickering.
-- We use WebSocket Broadcasts for collaboration, which is faster.
-- If the table is in the publication, the DB sends updates back to the sender, causing state conflicts.
do $$
begin
  if exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'boards'
  ) then
    alter publication supabase_realtime drop table boards;
  end if;
end;
$$;
