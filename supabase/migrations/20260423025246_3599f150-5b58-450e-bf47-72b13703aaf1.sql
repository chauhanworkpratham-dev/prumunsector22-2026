-- 1. Add event end date to editions
ALTER TABLE public.editions
  ADD COLUMN IF NOT EXISTS event_end_date timestamptz;

-- 2. Public contact persons (shown in footer, managed by secretariat)
CREATE TABLE IF NOT EXISTS public.contact_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  phone text NOT NULL,
  email text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view contacts" ON public.contact_persons;
CREATE POLICY "Anyone can view contacts" ON public.contact_persons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Secretariats manage contacts" ON public.contact_persons;
CREATE POLICY "Secretariats manage contacts" ON public.contact_persons
  FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'::app_role));

DROP TRIGGER IF EXISTS contact_persons_set_updated_at ON public.contact_persons;
CREATE TRIGGER contact_persons_set_updated_at
  BEFORE UPDATE ON public.contact_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();