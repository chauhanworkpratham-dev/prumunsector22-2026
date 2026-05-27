-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.participant_role AS ENUM ('delegate', 'executive_board', 'organising_committee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.eb_role AS ENUM ('chairperson', 'vice_chairperson', 'rapporteur');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'absent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ REGISTRATIONS: role + EB role + preferences ============
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS role public.participant_role NOT NULL DEFAULT 'delegate',
  ADD COLUMN IF NOT EXISTS eb_role public.eb_role,
  ADD COLUMN IF NOT EXISTS pref1_committee_id uuid REFERENCES public.committees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pref1_portfolio text,
  ADD COLUMN IF NOT EXISTS pref2_committee_id uuid REFERENCES public.committees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pref2_portfolio text,
  ADD COLUMN IF NOT EXISTS team_lead_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL;

-- Allow NULL committee/portfolio for OC members (who don't pick a committee)
ALTER TABLE public.registrations
  ALTER COLUMN committee_id DROP NOT NULL,
  ALTER COLUMN portfolio DROP NOT NULL;

-- One delegate-style portfolio claim per (committee, portfolio) — for delegates only
CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_delegate_portfolio
  ON public.registrations (edition_id, committee_id, portfolio)
  WHERE role = 'delegate' AND committee_id IS NOT NULL AND portfolio IS NOT NULL;

-- One EB role per (committee, eb_role)
CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_eb_role
  ON public.registrations (edition_id, committee_id, eb_role)
  WHERE role = 'executive_board' AND committee_id IS NOT NULL AND eb_role IS NOT NULL;

-- ============ COMMITTEES: team flag ============
ALTER TABLE public.committees
  ADD COLUMN IF NOT EXISTS is_team_committee boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_size integer NOT NULL DEFAULT 1;

-- ============ TEAM INVITES ============
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  team_lead_registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  invitee_name text NOT NULL,
  invitee_grade text,
  assigned_portfolio text NOT NULL,
  claimed_registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique by (edition, lowercased email) so a teammate can be invited at most once per edition
CREATE UNIQUE INDEX IF NOT EXISTS team_invites_unique_email
  ON public.team_invites (edition_id, lower(invitee_email));

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read invites by email" ON public.team_invites;
CREATE POLICY "Anyone can read invites by email" ON public.team_invites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create invites during registration" ON public.team_invites;
CREATE POLICY "Anyone can create invites during registration" ON public.team_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.editions e
      WHERE e.id = team_invites.edition_id AND e.is_active = true AND e.archived_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Anyone can mark invite claimed" ON public.team_invites;
CREATE POLICY "Anyone can mark invite claimed" ON public.team_invites
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Secretariats manage invites" ON public.team_invites;
CREATE POLICY "Secretariats manage invites" ON public.team_invites
  FOR DELETE USING (public.has_role(auth.uid(), 'secretariat'::app_role));

-- ============ ATTENDANCE ============
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  status public.attendance_status NOT NULL DEFAULT 'present',
  marked_at timestamptz NOT NULL DEFAULT now(),
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  method text NOT NULL DEFAULT 'manual',
  UNIQUE (registration_id, attendance_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Secretariats manage attendance" ON public.attendance;
CREATE POLICY "Secretariats manage attendance" ON public.attendance
  FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'::app_role));

-- Delegates can see their own attendance row (read-only)
DROP POLICY IF EXISTS "Delegates can view own attendance" ON public.attendance;
CREATE POLICY "Delegates can view own attendance" ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = attendance.registration_id AND r.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS attendance_edition_date_idx ON public.attendance (edition_id, attendance_date);