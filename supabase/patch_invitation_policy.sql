-- Fix: "permission denied for table users" when loading team invitations.
--
-- The previous invitation_read policy read from auth.users directly. RLS policies
-- run as the signed-in role, which cannot read auth.users. Use the JWT email
-- claim instead. Run this once in the Supabase SQL editor for the project the
-- app connects to.

DROP POLICY IF EXISTS invitation_read ON public.business_invitations;

CREATE POLICY invitation_read
    ON public.business_invitations FOR SELECT TO authenticated
    USING (
        public.has_business_permission(business_id, 'manage_members')
        OR LOWER(invited_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );
