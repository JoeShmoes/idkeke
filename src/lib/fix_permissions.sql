-- FIX FOR "SAVE TO DB FAILED" / PERMISSION DENIED ERRORS
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Enable Row Level Security (RLS) on the boards table
alter table public.boards enable row level security;

-- 2. Clean up existing policies (to avoid conflicts)
drop policy if exists "Allow public read access" on public.boards;
drop policy if exists "Allow public insert access" on public.boards;
drop policy if exists "Allow public update access" on public.boards;
drop policy if exists "Public access to boards" on public.boards;

-- 3. Create permissive policies for Collaboration
create policy "Allow public read access" on public.boards for select using (true);
create policy "Allow public insert access" on public.boards for insert with check (true);
create policy "Allow public update access" on public.boards for update using (true);

-- 4. Disable Realtime for 'boards' table (Prevents echo/flickering)
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

-- 5. RELOAD SCHEMA CACHE (Fixes PGRST204 "Could not find column" errors)
-- This forces Supabase to refresh its knowledge of the database structure.
NOTIFY pgrst, 'reload schema';
