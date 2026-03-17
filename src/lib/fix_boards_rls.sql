-- Fix for "Access Denied" on Shared Boards
-- This script ensures the 'boards' table allows public read/write access for collaboration.

-- 1. Enable Row Level Security (RLS) on the table
alter table public.boards enable row level security;

-- 2. Drop any existing policies that might be restricting access
drop policy if exists "Allow public read access" on public.boards;
drop policy if exists "Allow public insert access" on public.boards;
drop policy if exists "Allow public update access" on public.boards;
drop policy if exists "Public access to boards" on public.boards;

-- 3. Create permissive policies for public collaboration
-- Allow anyone to READ boards (so guest links work)
create policy "Allow public read access"
  on public.boards for select
  using (true);

-- Allow anyone to CREATE boards (so guests can start sessions if needed, though usually they join existing ones)
create policy "Allow public insert access"
  on public.boards for insert
  with check (true);

-- Allow anyone to UPDATE boards (so collaboration works in real-time)
create policy "Allow public update access"
  on public.boards for update
  using (true);

-- 4. Disable Realtime for 'boards' table to prevent "Echo" (we use Broadcasts instead)
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
