-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('secretariat', 'delegate');
CREATE TYPE public.committee_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE public.training_resource_type AS ENUM ('video', 'pdf', 'note', 'link');

-- ============== TIMESTAMP TRIGGER ==============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============== USER ROLES ==============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Secretariats can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'secretariat'));

CREATE POLICY "Secretariats can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));

-- ============== EDITIONS ==============
CREATE TABLE public.editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  countdown_title TEXT NOT NULL DEFAULT 'PRUMUN 2026',
  countdown_subtitle TEXT DEFAULT 'The countdown begins',
  venue_name TEXT DEFAULT 'Prudence School, Sector 22 Dwarka',
  venue_address TEXT DEFAULT 'Sector 22, Dwarka, New Delhi, 110077',
  instagram_url TEXT DEFAULT 'https://instagram.com/prumun',
  youtube_url TEXT DEFAULT 'https://youtube.com/@prumun',
  facebook_url TEXT DEFAULT 'https://facebook.com/prumun',
  is_active BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX one_active_edition ON public.editions (is_active) WHERE is_active = true;

CREATE POLICY "Anyone can view editions"
  ON public.editions FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage editions"
  ON public.editions FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER editions_set_updated BEFORE UPDATE ON public.editions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== COMMITTEES ==============
CREATE TABLE public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  agenda TEXT NOT NULL,
  description TEXT,
  difficulty committee_difficulty NOT NULL DEFAULT 'Intermediate',
  portfolios TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
CREATE INDEX committees_edition_idx ON public.committees(edition_id);

CREATE POLICY "Anyone can view committees"
  ON public.committees FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage committees"
  ON public.committees FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER committees_set_updated BEFORE UPDATE ON public.committees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== REGISTRATIONS ==============
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_image_path TEXT NOT NULL,
  portfolio TEXT NOT NULL,
  payment_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (committee_id, portfolio)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX registrations_edition_idx ON public.registrations(edition_id);
CREATE INDEX registrations_user_idx ON public.registrations(user_id);

-- Public can see occupied portfolios (for matrix) but only minimal fields
CREATE POLICY "Anyone can view occupied portfolios"
  ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Anyone can register"
  ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Secretariats can manage registrations"
  ON public.registrations FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER registrations_set_updated BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== ANNOUNCEMENTS ==============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX announcements_edition_idx ON public.announcements(edition_id);
CREATE POLICY "Anyone can view published announcements"
  ON public.announcements FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can manage announcements"
  ON public.announcements FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER announcements_set_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== SCHEDULE ==============
CREATE TABLE public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX schedule_edition_idx ON public.schedule_items(edition_id);
CREATE POLICY "Anyone can view schedule"
  ON public.schedule_items FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage schedule"
  ON public.schedule_items FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER schedule_set_updated BEFORE UPDATE ON public.schedule_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== TRAINING RESOURCES (on-demand library) ==============
CREATE TABLE public.training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  type training_resource_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;
CREATE INDEX training_resources_edition_idx ON public.training_resources(edition_id);
CREATE POLICY "Anyone can view training resources"
  ON public.training_resources FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage training resources"
  ON public.training_resources FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER training_resources_set_updated BEFORE UPDATE ON public.training_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== TRAINING SESSIONS (live scheduled) ==============
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  zoom_link TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX training_sessions_edition_idx ON public.training_sessions(edition_id);
CREATE POLICY "Anyone can view training sessions"
  ON public.training_sessions FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage training sessions"
  ON public.training_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));
CREATE TRIGGER training_sessions_set_updated BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== BROCHURES ==============
CREATE TABLE public.brochures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brochures ENABLE ROW LEVEL SECURITY;
CREATE INDEX brochures_edition_idx ON public.brochures(edition_id);
CREATE POLICY "Anyone can view brochures"
  ON public.brochures FOR SELECT USING (true);
CREATE POLICY "Secretariats can manage brochures"
  ON public.brochures FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));

-- ============== ARCHIVES (post-event snapshots) ==============
CREATE TABLE public.archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  edition_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  snapshot JSONB NOT NULL,
  delegate_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Secretariats can view archives"
  ON public.archives FOR SELECT
  USING (public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can manage archives"
  ON public.archives FOR ALL
  USING (public.has_role(auth.uid(), 'secretariat'))
  WITH CHECK (public.has_role(auth.uid(), 'secretariat'));

-- ============== STORAGE BUCKETS ==============
INSERT INTO storage.buckets (id, name, public) VALUES ('id-uploads', 'id-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('brochures', 'brochures', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('training-files', 'training-files', true);

-- id-uploads: anyone authenticated/anon can upload (for registration), only secretariat can read
CREATE POLICY "Anyone can upload ID images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'id-uploads');
CREATE POLICY "Secretariats can read ID images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'id-uploads' AND public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can delete ID images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'id-uploads' AND public.has_role(auth.uid(), 'secretariat'));

-- brochures: public read, secretariat write
CREATE POLICY "Anyone can read brochures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brochures');
CREATE POLICY "Secretariats can upload brochures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can update brochures"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can delete brochures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brochures' AND public.has_role(auth.uid(), 'secretariat'));

-- training-files: public read, secretariat write
CREATE POLICY "Anyone can read training files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-files');
CREATE POLICY "Secretariats can upload training files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can update training files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'secretariat'));
CREATE POLICY "Secretariats can delete training files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'secretariat'));

-- ============== SEED INITIAL EDITION + COMMITTEES ==============
INSERT INTO public.editions (name, event_date, countdown_title, countdown_subtitle, is_active)
VALUES ('PRUMUN 2026', '2026-08-01 09:00:00+05:30', 'PRUMUN 2026', 'The countdown begins', true);

INSERT INTO public.committees (edition_id, name, short_name, agenda, description, difficulty, portfolios, sort_order)
SELECT e.id, c.name, c.short_name, c.agenda, c.description, c.difficulty::committee_difficulty, c.portfolios, c.sort_order
FROM public.editions e,
(VALUES
  ('United Nations Security Council', 'UNSC', 'The situation in the Indo-Pacific with emphasis on maritime security', 'The most powerful body of the UN, dealing with matters of international peace and security.', 'Advanced',
    ARRAY['United States of America','Russian Federation','People''s Republic of China','United Kingdom','France','India','Japan','Germany','Brazil','South Africa','United Arab Emirates','Republic of Korea','Australia','Indonesia','Vietnam'], 1),
  ('United Nations Human Rights Council', 'UNHRC', 'Addressing human rights violations in conflict zones with focus on protection of civilians', 'Promoting and protecting human rights worldwide.', 'Intermediate',
    ARRAY['United States','United Kingdom','France','Germany','Canada','India','China','Russia','Brazil','Argentina','Mexico','Saudi Arabia','Qatar','Iran','Israel','Palestine','Ukraine','Poland','Switzerland','Norway'], 2),
  ('Disarmament & International Security Committee', 'DISEC', 'Regulation of autonomous weapons systems and emerging military AI', 'First committee of the General Assembly dealing with global security challenges.', 'Intermediate',
    ARRAY['USA','Russia','China','India','Pakistan','France','UK','North Korea','South Korea','Japan','Iran','Israel','Turkey','Egypt','Saudi Arabia','Brazil','Argentina','Australia','Germany','Italy','Spain','Sweden'], 3),
  ('Economic & Social Council', 'ECOSOC', 'Sustainable economic recovery in post-pandemic developing nations', 'Coordinating economic, social and related work of UN specialized agencies.', 'Beginner',
    ARRAY['United States','China','India','Brazil','Russia','Japan','Germany','United Kingdom','France','Canada','Australia','South Africa','Nigeria','Kenya','Egypt','Mexico','Indonesia','Vietnam','Thailand','Bangladesh'], 4),
  ('All India Political Parties Meet', 'AIPPM', 'Uniform Civil Code: balancing diversity and equality', 'Indian political simulation with leaders from major parties.', 'Intermediate',
    ARRAY['Narendra Modi','Rahul Gandhi','Mamata Banerjee','Arvind Kejriwal','M. K. Stalin','Akhilesh Yadav','Sharad Pawar','Asaduddin Owaisi','Mehbooba Mufti','Sitaram Yechury','Yogi Adityanath','Amit Shah','Priyanka Gandhi','Tejashwi Yadav','Naveen Patnaik','K. Chandrashekar Rao'], 5),
  ('International Press Corps', 'IPC', 'Reporting and Photography across all committees', 'Journalists, photographers and caricaturists covering the conference.', 'Beginner',
    ARRAY['Reuters Journalist','BBC Correspondent','Al Jazeera Reporter','The New York Times','The Hindu','The Guardian','CNN','AP Photographer','Caricaturist (Political)','Caricaturist (Cultural)','Times of India','Washington Post'], 6)
) AS c(name, short_name, agenda, description, difficulty, portfolios, sort_order)
WHERE e.is_active = true;