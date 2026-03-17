-- Create the user_data table to store application state
create table public.user_data (
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- Enable Row Level Security (RLS)
alter table public.user_data enable row level security;

-- Create policies to allow users to manage their own data
create policy "Users can view their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Create a realtime publication for the table
alter publication supabase_realtime add table public.user_data;
