-- Disclaimer texts on editions
ALTER TABLE public.editions
  ADD COLUMN IF NOT EXISTS disclaimer_qr text NOT NULL DEFAULT 'Do not share this QR code with anyone — it is your unique entry pass.',
  ADD COLUMN IF NOT EXISTS disclaimer_ai text NOT NULL DEFAULT 'Use the AI assistant wisely. Verify every fact yourself — do not rely on it for everything.';

-- Secretariat profiles (full names)
CREATE TABLE IF NOT EXISTS public.secretariat_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.secretariat_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secretariats view profiles"
  ON public.secretariat_profiles FOR SELECT
  USING (public.has_role(auth.uid(),'secretariat') OR auth.uid() = user_id);

CREATE POLICY "Users manage own profile"
  ON public.secretariat_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner manages all profiles"
  ON public.secretariat_profiles FOR ALL
  USING (public.is_owner_secretariat(auth.uid()))
  WITH CHECK (public.is_owner_secretariat(auth.uid()));

CREATE TRIGGER update_secretariat_profiles_updated_at
  BEFORE UPDATE ON public.secretariat_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI chat logs (delegate/EB/OC ↔ assistant)
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,
  edition_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_chats_reg ON public.ai_chats(registration_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chats_edition ON public.ai_chats(edition_id);
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chat logs"
  ON public.ai_chats FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id));

CREATE POLICY "Secretariats view all chats"
  ON public.ai_chats FOR SELECT
  USING (public.has_role(auth.uid(),'secretariat'));

CREATE POLICY "Delegates view own chats"
  ON public.ai_chats FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid()));

CREATE POLICY "Secretariats delete chats"
  ON public.ai_chats FOR DELETE
  USING (public.has_role(auth.uid(),'secretariat'));