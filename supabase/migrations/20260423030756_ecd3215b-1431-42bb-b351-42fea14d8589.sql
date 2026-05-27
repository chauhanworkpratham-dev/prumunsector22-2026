DROP POLICY IF EXISTS "Anyone can mark invite claimed" ON public.team_invites;
CREATE POLICY "Anyone can mark invite claimed" ON public.team_invites
  FOR UPDATE
  USING (claimed_registration_id IS NULL)
  WITH CHECK (claimed_registration_id IS NOT NULL);