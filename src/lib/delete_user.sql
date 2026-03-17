-- Function to allow users to delete their own account
-- Run this in your Supabase SQL Editor

create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete the user from the auth.users table
  -- This will cascade to other tables if foreign keys are set up with ON DELETE CASCADE
  delete from auth.users where id = auth.uid();
end;
$$;
