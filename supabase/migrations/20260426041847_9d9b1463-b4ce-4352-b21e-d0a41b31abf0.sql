-- ============== member_permissions table ==============
CREATE TABLE IF NOT EXISTS public.member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tab TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'view' CHECK (level IN ('none','view','edit','delete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tab)
);

ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

-- Owner detection: first user with secretariat role (lowest created_at) is the owner.
CREATE OR REPLACE FUNCTION public.is_owner_secretariat(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = 'secretariat'
    ORDER BY created_at ASC
    LIMIT 1
  ) AND (
    SELECT user_id FROM public.user_roles
    WHERE role = 'secretariat'
    ORDER BY created_at ASC
    LIMIT 1
  ) = _user_id
$$;

CREATE POLICY "Secretariats can view permissions"
  ON public.member_permissions FOR SELECT
  USING (public.has_role(auth.uid(), 'secretariat'));

CREATE POLICY "Owner can manage permissions"
  ON public.member_permissions FOR ALL
  USING (public.is_owner_secretariat(auth.uid()))
  WITH CHECK (public.is_owner_secretariat(auth.uid()));

CREATE TRIGGER trg_member_permissions_updated_at
  BEFORE UPDATE ON public.member_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== registrations: portfolio change tracking ==============
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS portfolio_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portfolio_changes_used INTEGER NOT NULL DEFAULT 0;

-- Allow anyone to update their own registration's portfolio while not locked
-- (frontend gates this via the 60s timer; server enforces the lock window).
CREATE POLICY "Open portfolio swap before lock"
  ON public.registrations FOR UPDATE
  USING (
    portfolio_locked_at IS NULL
    AND portfolio_changes_used < 1
    AND role = 'delegate'
  )
  WITH CHECK (
    portfolio_changes_used <= 1
    AND role = 'delegate'
  );

-- ============== editions: editable logo ==============
ALTER TABLE public.editions
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- ============== user_roles: granted_by ==============
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS granted_by UUID;

-- ============== Storage bucket: site-logos ==============
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-logos', 'site-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Site logos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-logos');

-- Secretariat write
CREATE POLICY "Secretariats can upload site logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-logos' AND public.has_role(auth.uid(), 'secretariat'));

CREATE POLICY "Secretariats can update site logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-logos' AND public.has_role(auth.uid(), 'secretariat'));

CREATE POLICY "Secretariats can delete site logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-logos' AND public.has_role(auth.uid(), 'secretariat'));