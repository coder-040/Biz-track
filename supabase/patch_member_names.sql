-- Fix: show team member names and roles on the Team page.
--
-- user_profiles RLS only lets users read their own profile, so the Team page
-- could only show roles ("owner", "staff"). This SECURITY DEFINER function
-- safely exposes member names/emails to users who can manage members.
--
-- Run this once in the Supabase SQL editor for the project the app connects to.

CREATE OR REPLACE FUNCTION public.list_business_members(
    p_business_id uuid
)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    email text,
    role text,
    joined_at timestamptz,
    is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        bm.user_id,
        COALESCE(
            NULLIF(BTRIM(up.full_name), ''),
            NULLIF(split_part(LOWER(au.email), '@', 1), ''),
            'Team member'
        ) AS full_name,
        LOWER(au.email) AS email,
        bm.role,
        bm.joined_at,
        bm.is_active
    FROM public.business_members AS bm
    LEFT JOIN public.user_profiles AS up ON up.id = bm.user_id
    LEFT JOIN auth.users AS au ON au.id = bm.user_id
    WHERE bm.business_id = p_business_id
      AND bm.user_id IS NOT NULL
      AND bm.is_active
      AND public.has_business_permission(p_business_id, 'manage_members')
    ORDER BY bm.joined_at ASC;
$$;

REVOKE ALL ON FUNCTION public.list_business_members(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_business_members(uuid) TO authenticated;
