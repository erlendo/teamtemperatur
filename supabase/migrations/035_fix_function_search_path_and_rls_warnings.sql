-- Fix Supabase linter warnings while maintaining user permissions
-- Date: 2026-02-11
-- Addresses: function_search_path_mutable and rls_policy_always_true warnings

-- ============================================================
-- 1. FIX FUNCTION SEARCH_PATH (Security warning)
-- ============================================================
-- Setting explicit search_path prevents search_path hijacking attacks

ALTER FUNCTION public.get_team_year_stats(uuid, int) 
  SET search_path = public;

ALTER FUNCTION public.get_team_tag_suggestions(uuid) 
  SET search_path = public;

ALTER FUNCTION public.get_team_week_stats(uuid, int) 
  SET search_path = public;

ALTER FUNCTION public.create_default_questionnaire(uuid, uuid) 
  SET search_path = public;

-- ============================================================
-- 2. FIX RLS POLICIES (Keep functionality, improve validation)
-- ============================================================

-- TEAMS: Keep as-is - intentionally permissive
-- All authenticated users should be able to create teams
-- Policy "teams_insert_authenticated" is correct by design

-- TEAM_MEMBERSHIPS: Improve validation while keeping functionality
-- Users can:
--   1. Add themselves as owner when creating a team
--   2. Add themselves as member when joining a team  
--   3. Be added by team owner/admin (validated in server action)

DROP POLICY IF EXISTS "memberships_insert_if_admin" ON public.team_memberships;

CREATE POLICY "memberships_insert_authenticated"
  ON public.team_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to add themselves (createTeam as owner, joinTeam as member)
    user_id = auth.uid()
    OR
    -- Allow owner/admin to add other users (validated in server actions)
    public.team_role(team_id) IN ('owner', 'admin')
  );

-- QUESTIONNAIRES & QUESTIONS: Check if permissive policies exist and remove them
-- These tables should only be writable by admins (existing policies)

DO $$ 
BEGIN
  -- Remove questionnaires_insert_authenticated if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'questionnaires' 
    AND policyname = 'questionnaires_insert_authenticated'
  ) THEN
    DROP POLICY questionnaires_insert_authenticated ON public.questionnaires;
  END IF;

  -- Remove questions_insert_authenticated if it exists  
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'questions'
    AND policyname = 'questions_insert_authenticated'
  ) THEN
    DROP POLICY questions_insert_authenticated ON public.questions;
  END IF;
END $$;

-- Verify existing admin-only write policies for questionnaires and questions
-- These should already exist from migration 001_init.sql:
-- - questionnaires_write_if_admin (for all operations)
-- - questions_write_if_admin (for all operations)
