-- Migration: Auth Trigger for AgriConnect
-- Phase 2: Automatically create a public.users record when a new auth.users record is created
-- Created at: 2026-08-10

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user's ID into public.users.
  -- We rely on the database schema defaults to set role='farmer' and verified=false.
  -- ON CONFLICT ensures that if a record already exists, we do not overwrite their role or status.
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows the trigger to execute with the privileges of the function creator,
-- ensuring it can write to public.users even when triggered by the auth system.

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
