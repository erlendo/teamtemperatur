-- Migration 027: Add user_profiles table for storing first names
-- This allows us to display user-friendly first names instead of email addresses

BEGIN;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own and team members' profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can view each other's profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm1
      JOIN public.team_memberships tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = user_profiles.user_id
      AND tm1.status = 'active'
      AND tm2.status = 'active'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX user_profiles_user_id_idx ON public.user_profiles(user_id);

COMMIT;
